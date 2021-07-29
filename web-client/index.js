import Thimbleful from 'thimbleful';

const VIP       = 0;
const STRICTVIP = 1;
const SCHIP     = 2;
const XOCHIP    = 3;

window.addEventListener('load', async () => {
  const Emulator = require('./emulator');
  const keyboard = require('./keyboard');
  const render = require('./display');
  const { playSound, stopSound } = require('./sound');

  const instance = new Emulator({ render, playSound, stopSound });
  await instance.init();
  keyboard(instance);

  const program = new Uint8Array([
    0x00, 0xe0, 0x61, 0x19, 0x60, 0x0a, 0x22, 0x12, 0x60,
    0x0b, 0x22, 0x12, 0x60, 0x0c, 0x22, 0x12, 0x12, 0x10,
    0x62, 0x0c, 0xf0, 0x29, 0xd1, 0x25, 0x71, 0x05, 0x00,
    0xee
  ]);

  instance.loadProgram(VIP, program);

  const fileTarget = Thimbleful.FileTarget.instance();
  fileTarget.register('#display', (file, data) => {
    if ( file.name.substr(-4) != '.ch8' )
      return alert('You can only load *.ch8 CHIP-8 ROMs');
    data = atob(data.split(',')[1]);
    const program = new Uint8Array(new ArrayBuffer(data.length));
    for ( let i = 0; i < data.length; i++ )
      program[i] = data.charCodeAt(i);
    instance.loadProgram(VIP, program);
  });
});
