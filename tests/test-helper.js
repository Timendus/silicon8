// WebAssembly Silicon8 module loading and running stuff

const fs = require('fs');
const font = require('../shared/font');
const types = require('../shared/types');
require('../docs/wasm_exec');

let randomByte, playSound, stopSound, render;
const go = new Go();
const mod = new WebAssembly.Module(fs.readFileSync('./docs/silicon8.wasm'));
Object.assign(go.importObject.env, {
  'main.randomByte': () => randomByte(),
  'main.playSound':  () => playSound(),
  'main.stopSound':  () => stopSound(),
  'main.render':     () => render()
});
const instance = new WebAssembly.Instance(mod, go.importObject);
const cpu = instance.exports;
go.run(instance);

module.exports = {
  types,

  run: ({type, rom, cycles, test, callbacks = {}}) => {
    randomByte = () => callbacks.randomByte ? callbacks.randomByte() : Math.floor(Math.random() * Math.floor(256));
    playSound  = () => callbacks.playSound  ? callbacks.playSound()  : null;
    stopSound  = () => callbacks.stopSound  ? callbacks.stopSound()  : null;
    render     = () => callbacks.render     ? callbacks.render()     : null;

    const program = new Uint8Array(fs.readFileSync(rom));
    cpu.reset(type);
    const ram = new Uint8Array(cpu.memory.buffer, cpu.ramPtr(), cpu.ramSize());

    // Load font and program into RAM
    const fontData = font(type);
    for ( let i = 0; i < fontData.length; i++ ) ram[i] = fontData[i];
    for ( let i = 0x200; i < 0x200 + program.length; i++ ) ram[i] = program[i - 0x200];

    cpu.runCycles(cycles);
    const display = new Uint8Array(cpu.memory.buffer, cpu.displayPtr(), cpu.displaySize());
    test(Array.from(ram), Array.from(display));
  }
};

// Bitmap generation and comparison stuff

const bmp = require("bmp-js");

function toBMPData(input) {
  const output = [];
  for ( let i = 0; i < input.length; i += 3 ) {
    output.push(0);
    output.push(input[i+2]);
    output.push(input[i+1]);
    output.push(input[i+0]);
  }
  return output;
}

expect.extend({

  toRenderTo(got, expected) {
    const data = toBMPData(got);
    let width  = got.length > 6144 ? 128 : 64;
    let height = got.length > 6144 ?  64 : 32;
    const encoded = bmp.encode({ data, width, height });
    fs.writeFileSync(expected, encoded.data);
    return { pass: true };
  },

  toLookLike(got, expected) {
    const data = toBMPData(got);
    const image = bmp.decode(fs.readFileSync(expected));
    const expectedData = new Uint8Array(image.data);
    const equalLength = data.length === expectedData.length;
    let i = 0;
    while ( i < data.length && data[i] == expectedData[i] ) i++
    const equalBytes = i == data.length;
    const pass = equalLength && equalBytes;
    const message = () => equalLength ?
      `Image data doesn't match BMP file '${expected}' at index ${i}:\n   Expected: ${expectedData.slice(i, i+20).toString()}\n   Got:      ${data.slice(i, i+20).toString()}` :
      `Image data length (${got.length}) doesn't match BMP file '${expected}' length (${expectedData.length})`;
    return { pass, message };
  }

});
