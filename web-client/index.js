const font = require('./font');
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

  // Virtual display

  const canvas  = document.getElementById('display');
  const context = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 32;

  function render(bytes) {
    const imageData = context.createImageData(64, 32);
    for ( let y = 0; y < 32; y++ ) {
      for ( let x = 0; x < 64; x++ ) {
        const memoryOffset  = Math.floor(y * 64 / 8 + x / 8);
        const pixelOffset   = x % 8;
        const displayOffset = y * 64 * 4 + x * 4;
        imageData.data[displayOffset+0] = bytes[memoryOffset] & (0b10000000 >> pixelOffset) ? 0xFF : 0x00;
        imageData.data[displayOffset+1] = bytes[memoryOffset] & (0b10000000 >> pixelOffset) ? 0xAA : 0x00;
        imageData.data[displayOffset+2] = bytes[memoryOffset] & (0b10000000 >> pixelOffset) ? 0x44 : 0x00;
        imageData.data[displayOffset+3] = 0xDD;
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  // Keyboard input

  const keys = {
    // Arrow keys
    38: 5, 		// up
    37: 7, 		// left
    39: 9, 		// right
    40: 8, 		// down

    // 16 key pad
    49: 1,		// 1
    50: 2,		// 2
    51: 3,		// 3
    52: 'C',	// 4
    81: 4, 		// Q
    87: 5, 		// W
    69: 6, 		// E
    82: 'D', 	// R
    65: 7, 		// A
    83: 8, 		// S
    68: 9, 		// D
    70: 'E', 	// F
    90: 'A', 	// Z
    88: 0, 		// X
    67: 'B', 	// C
    86: 'F', 	// V

    // Other number keys
    48: 0,
    53: 5,
    54: 6,
    55: 7,
    56: 8,
    57: 9,
  };
  window.addEventListener('keydown', e => {
    if ( cpu ) cpu.pressKey(keys[e.keyCode]);
  });
  window.addEventListener('keyup', e => {
    if ( cpu ) cpu.releaseKey(keys[e.keyCode]);
  });
});
