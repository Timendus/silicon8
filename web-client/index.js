import Thimbleful from 'thimbleful';
const types = require('../shared/types');
const cbf = require('chip8-binary-format');
const Chip8Database = require('./database.js');
const Notification = require('./notification');

import welcome from "!!binary-loader!./welcome.ch8";
const welcomeProgram = new Uint8Array(welcome.length);
for (let i = 0; i < welcome.length; i++)
  welcomeProgram[i] = welcome.charCodeAt(i);

window.addEventListener('load', async () => {
  const Emulator = require('./emulator');
  const Keyboard = require('./keyboard');
  const Gamepad = require('./gamepad');
  const settings = require('./settings');
  const display = require('./display');
  const database = new Chip8Database();
  const { playSound, stopSound } = require('./sound');

  const instance = new Emulator({ display, playSound, stopSound });
  const keyboard = new Keyboard(instance);
  const gamepad = new Gamepad(instance);

  await instance.init();
  const showSettings = settings(instance, keyboard, gamepad);

  instance.loadProgram(types.AUTO, welcomeProgram);
  instance.start();

  // Try to preload the CHIP-8 database. Not strictly necessary as the
  // findProgram call below does it too, but this makes ROM lookup faster when
  // the user uploads a file.
  try {
    await database.initialize();
    new Notification(`🚀 Metadata from CHIP-8 database available`);
  } catch(e) {
    console.error(e);
    new Notification(`😢 Not able to fetch metadata from the CHIP-8 database`);
  }

  const fileTarget = Thimbleful.FileTarget.instance();
  fileTarget.register('#display', async (file, data) => {
    const extension = file.name.split(".").pop();

    if (extension == "c8b") {
      const file = cbf.unpack(base64ToUint8Array(data));
      const program = file.bytecode[0].bytecode;
      const typeMap = {
        1: types.VIP,
        0x2C: types.SCHIP,
        0x2D: types.SCHIP,
        0x34: types.XOCHIP
      };
      instance.stop();
      instance.loadProgram(typeMap[file.bytecode[0].platforms[0]], program);
      instance.setCyclesPerFrame(file.properties.cyclesPerFrame || 30);
      instance.start();

    } else {
      if (!(extension in extensionMap)) {
        return alert('You can only load CHIP-8 ROMs');
      }

      const program = base64ToUint8Array(data);
      const searching = new Notification(`Searching for metadata...`);

      let metadata;
      try {
        metadata = await database.findProgram(program);
        metadata.platform = metadata.getPreferredPlatform(platformsWeSupport);
        new Notification(`🚀 Found metadata for this ROM in the CHIP-8 database`);
      } catch(err) {
        console.error(err);
        metadata = {
          title: file.name,
          platform: {
            code: platformsWeSupport[extensionMap[extension]]
          }
        };
      }
      searching.close();
      if (metadata.platform.code == undefined)
        if (confirm("Sorry, we probably can't run programs for that platform. Do you want to try anyway?"))
          metadata.platform = { code: types.AUTO };
        else
          return;

      instance.stop();
      showSettings(metadata, program);
    }
  });
});

function base64ToUint8Array(data) {
  data = atob(data.split(',')[1]);
  const file = new Uint8Array(new ArrayBuffer(data.length));
  for ( let i = 0; i < data.length; i++ )
    file[i] = data.charCodeAt(i);
  return file;
}

const extensionMap = {
  ch8: "auto",
  sc8: "superchip",
  xo8: "xochip",
  c8x: "chip8x",
  mc8: "megachip8",
  hc8: "hybridVIP",
  c8h: "hiresChip8",
};

const platformsWeSupport = {
  "auto": types.AUTO,
  "originalChip8": types.VIP,
  "superchip": types.SCHIP,
  "xochip": types.XOCHIP,
};
