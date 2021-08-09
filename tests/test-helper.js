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

    // Clear RAM
    const ramSize = cpu.ramSize();
    for ( let i = 0; i < ramSize; i++ ) ram[i] = 0;
    // Load font and program into RAM
    const fontData = font(type);
    for ( let i = 0; i < fontData.length; i++ ) ram[i] = fontData[i];
    for ( let i = 0x200; i < 0x200 + program.length; i++ ) ram[i] = program[i - 0x200];

    cpu.runCycles(cycles);
    const display = new Uint8Array(cpu.memory.buffer, cpu.displayPtr(), cpu.displaySize());
    test(ram, display);
  }
};
