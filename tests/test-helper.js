const fs = require('fs');
const font = require('../web-client/font');
require('../docs/wasm_exec');

const go = new Go();
const mod = new WebAssembly.Module(fs.readFileSync('./docs/silicon8.wasm'));
Object.assign(go.importObject.env, {
  'main.randomByte': () => Math.floor(Math.random() * Math.floor(256)),
  'main.playSound':  () => {},
  'main.stopSound':  () => {}
});
const instance = new WebAssembly.Instance(mod, go.importObject);
const cpu = instance.exports;
go.run(instance);

module.exports = {
  types: {
    VIP:       0, // Note that these halt for display refresh, use BLINDVIP instead
    STRICTVIP: 1, // Note that these halt for display refresh, use BLINDVIP instead
    SCHIP:     2,
    XOCHIP:    3,
    BLINDVIP:  4
  },

  run: ({type, rom, cycles, test}) => {
    const program = new Uint8Array(fs.readFileSync(rom));
    cpu.initialize(type);

    const display = new Uint8Array(cpu.memory.buffer, cpu.displayPtr(), cpu.displaySize());
    const ram = new Uint8Array(cpu.memory.buffer, cpu.ramPtr(), cpu.ramSize());

    // Clear RAM
    const ramSize = cpu.ramSize();
    for ( let i = 0; i < ramSize; i++ ) ram[i] = 0;
    // Load font and program into RAM
    for ( let i = 0; i < font.length; i++ ) ram[i] = font[i];
    for ( let i = 0x200; i < 0x200 + program.length; i++ ) ram[i] = program[i - 0x200];

    cpu.cycles(cycles);
    test(ram, display);
  }
};
