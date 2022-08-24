import Thimbleful from 'thimbleful';
const types = require('../shared/types');
const cbf = require('chip8-binary-format');

import welcome from "!!binary-loader!./welcome.ch8";
const welcomeProgram = new Uint8Array(welcome.length);
for (let i = 0; i < welcome.length; i++)
  welcomeProgram[i] = welcome.charCodeAt(i);

window.addEventListener('load', async () => {
  const Emulator = require('./emulator');
  const keyboard = require('./keyboard');
  const gamepad = require('./gamepad');
  const settings = require('./settings');
  const display = require('./display');
  const { playSound, stopSound } = require('./sound');

  const instance = new Emulator({ display, playSound, stopSound });
  await instance.init();
  keyboard(instance);
  gamepad(instance);
  const showSettings = settings(instance);

  instance.loadProgram(types.AUTO, welcomeProgram);
  instance.start();

  const fileTarget = Thimbleful.FileTarget.instance();
  fileTarget.register('#display', (file, data) => {
    let program;
    switch ( file.name.substr(-4) ) {
      case '.ch8':
        program = base64ToUint8Array(data);
        instance.stop();
        showSettings(program);
        break;
      case '.c8b':
        const file = cbf.unpack(base64ToUint8Array(data));
        program = file.bytecode[0].bytecode;
        const typeMap = {
          1: types.VIP,
          0x2C: types.SCHIP,
          0x2D: types.SCHIP,
          0x34: types.XOCHIP
        };
        console.log(file);
        instance.stop();
        instance.loadProgram(typeMap[file.bytecode[0].platforms[0]], program);
        instance.setCyclesPerFrame(file.properties.cyclesPerFrame || 30);
        instance.start();
        break;
      default:
        return alert('You can only load *.ch8 CHIP-8 ROMs');
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
