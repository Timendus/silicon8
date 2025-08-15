#!/usr/bin/env node

if ( process.argv.length != 3 || process.argv[2].substr(-4) != ".ch8" ) {
  return console.error("Supply the path to a CHIP-8 ROM (*.ch8) as an argument");
}

const fs = require('fs');
const program = new Uint8Array(fs.readFileSync(process.argv[2]));

const types = require('./docs/js/shared/types');
const Input = require('./input');
const input = new Input();

require('./docs/wasm_exec');
let cpu;
const go = new Go();
const mod = new WebAssembly.Module(fs.readFileSync('./docs/silicon8.wasm'));
Object.assign(go.importObject.env, {
  randomByte: () => Math.floor(Math.random() * Math.floor(256)),
  playSound:  () => process.stdout.write('\x07'),
  stopSound:  () => {},
  render:     (width, height, dataPtr) => {
    const data = new Uint8Array(cpu.memory.buffer, dataPtr, width * height * 3);
    render(data, width, height);
  }
});
const instance = new WebAssembly.Instance(mod, go.importObject);
cpu = instance.exports;
go.run(instance);
setInterval(() => cpu.clockTick(), 1000 / 60);
cpu.reset(types.AUTO);

// Load program into RAM
const ram = new Uint8Array(cpu.memory.buffer, cpu.ramPtr(), cpu.ramSize());
for ( let i = 0x200; i < 0x200 + program.length; i++ )
  ram[i] = program[i - 0x200];

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

function render(data, width, height) {
  for ( let y = 0; y < height; y++ ) {
    let line = "";
    for ( let x = 0; x < width; x++ ) {
      // Take the average colour, reducing the image to monochrome
      const index = (y * width + x) * 3;
      const byte = (data[index+0] + data[index+1] + data[index+2]) / 3;
      let character = '  ';
      if ( byte > 0x00 ) character = '··';
      if ( byte > 0x55 ) character = '⠿⠿'
      if ( byte > 0xAA ) character = '██';
      line += character;
    }
    console.log(line);
  }
}
