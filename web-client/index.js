import Thimbleful from 'thimbleful';

if (!WebAssembly.instantiateStreaming) { // polyfill
  WebAssembly.instantiateStreaming = async (resp, importObject) => {
    const source = await (await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject);
  };
}

const VIP       = 0;
const STRICTVIP = 1;
const SCHIP     = 2;
const XOCHIP    = 3;

window.addEventListener('load', () => {
  const font = require('./font');
  const keyboard = require('./keyboard');
  const render = require('./display');

  const go = new Go();
  Object.assign(go.importObject.env, {
    'main.randomByte': () => Math.floor(Math.random() * Math.floor(256)),
    'main.playSound':  () => {},
    'main.stopSound':  () => {}
  });

  let cpu;
  WebAssembly.instantiateStreaming(fetch("silicon8.wasm"), go.importObject)
  .then(result => {
    cpu = result.instance.exports;
    go.run(result.instance);
    keyboard(cpu);

    const program = new Uint8Array([
      0x00, 0xe0, 0x61, 0x19, 0x60, 0x0a, 0x22, 0x12, 0x60, 0x0b, 0x22, 0x12, 0x60, 0x0c,
      0x22, 0x12, 0x12, 0x10, 0x62, 0x0c, 0xf0, 0x29, 0xd1, 0x25, 0x71, 0x05, 0x00, 0xee
    ]);

    loadProgram(cpu, program);

    const cyclesPerFrame = 30;
    const display = new Uint8Array(cpu.memory.buffer, cpu.displayPtr(), cpu.displaySize());
    setInterval(() => {
      cpu.cycles(cyclesPerFrame);

      if ( cpu.screenDirty() ) {
        render(display);
        cpu.setScreenClean();
      }
    }, 1000 / 60);
  })
  .catch(err => console.error(err));

  const fileTarget = Thimbleful.FileTarget.instance();
  fileTarget.register('#display', (file, data) => {
    if ( file.name.substr(-4) != '.ch8' )
      return alert('You can only load *.ch8 CHIP-8 ROMs');
    data = atob(data.split(',')[1]);
    const program = new Uint8Array(new ArrayBuffer(data.length));
    for ( let i = 0; i < data.length; i++ )
      program[i] = data.charCodeAt(i);
    loadProgram(cpu, program);
  });

  function loadProgram(cpu, program) {
    cpu.initialize(VIP);
    const ram = new Uint8Array(cpu.memory.buffer, cpu.ramPtr(), cpu.ramSize());
    // Clear RAM
    const ramSize = cpu.ramSize();
    for ( let i = 0; i < ramSize; i++ ) ram[i] = 0;
    // Load font and program into RAM
    for ( let i = 0; i < font.length; i++ ) ram[i] = font[i];
    for ( let i = 0x200; i < 0x200 + program.length; i++ ) ram[i] = program[i - 0x200];
  }
});
