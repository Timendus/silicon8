import Thimbleful from 'thimbleful';
const types = require('../shared/types');

import welcome from "!!binary-loader!./welcome.ch8";
const welcomeProgram = new Uint8Array(welcome.length);
for (let i = 0; i < welcome.length; i++)
  welcomeProgram[i] = welcome.charCodeAt(i);

window.addEventListener('load', async () => {
  const Emulator = require('./emulator');
  const keyboard = require('./keyboard');
  const display = require('./display');
  const { playSound, stopSound } = require('./sound');

  const instance = new Emulator({ display, playSound, stopSound });
  await instance.init();
  keyboard(instance);

  instance.loadProgram(types.AUTO, welcomeProgram);

  // const fileTarget = Thimbleful.FileTarget.instance();
  // fileTarget.register('#display', (file, data) => {
  //   if ( file.name.substr(-4) != '.ch8' )
  //     return alert('You can only load *.ch8 CHIP-8 ROMs');
  //   data = atob(data.split(',')[1]);
  //   const program = new Uint8Array(new ArrayBuffer(data.length));
  //   for ( let i = 0; i < data.length; i++ )
  //     program[i] = data.charCodeAt(i);
  //   instance.loadProgram(types.AUTO, program);
  // });
});
