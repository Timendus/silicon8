#!/usr/bin/env node

if ( process.argv.length != 3 || process.argv[2].substr(-4) != ".ch8" ) {
  return console.error("Supply the path to a CHIP-8 ROM (*.ch8) as an argument");
}

const fs = require('fs');
const program = new Uint8Array(fs.readFileSync(process.argv[2]));

const font = require('./shared/font');
const types = require('./shared/types');
const Input = require('./input');
const input = new Input();

require('./docs/wasm_exec');
const go = new Go();
const mod = new WebAssembly.Module(fs.readFileSync('./docs/silicon8.wasm'));
Object.assign(go.importObject.env, {
  'main.randomByte': () => Math.floor(Math.random() * Math.floor(256)),
  'main.playSound':  () => process.stdout.write('\x07'),
  'main.stopSound':  () => {}
});
const instance = new WebAssembly.Instance(mod, go.importObject);
const cpu = instance.exports;

go.run(instance);
cpu.initialize(types.VIP);

// Load font and program into RAM
const ram = new Uint8Array(cpu.memory.buffer, cpu.ramPtr(), cpu.ramSize());
const fontData = font(types.VIP);
for ( let i = 0; i < fontData.length; i++ )
  ram[i] = fontData[i];
for ( let i = 0x200; i < 0x200 + program.length; i++ )
  ram[i] = program[i - 0x200];

const display = new Uint8Array(cpu.memory.buffer, cpu.displayPtr(), cpu.displaySize());

const keys = {
  up: 5,
  left: 7,
  down: 8,
  right: 9
};
input.addKeyListener(key => {
  if ( Object.keys(keys).includes(key) ) {
    cpu.pressKey(keys[key]);
    setTimeout(() => cpu.releaseKey(keys[key]), 100);
  }
});

const cyclesPerFrame = 1000;
setInterval(() => {
  cpu.cycles(cyclesPerFrame);

  if ( cpu.screenDirty() ) {
    render(display);
    cpu.setScreenClean();
  }
}, 1000 / 60);

function render(display) {
  for ( let y = 0; y < 32; y++ ) {
    let line = "";
    for ( let x = 0; x < 8; x++ ) {
      const byte = display[y * 8 + x];
      for ( let i = 0x80; i > 0; i = i >> 1 ) {
        line += byte & i ? '██' : '  ';
      }
    }
    console.log(line);
  }
}
