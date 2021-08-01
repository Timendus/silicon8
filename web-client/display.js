const canvas  = document.getElementById('display');
const context = canvas.getContext('2d');
canvas.width = 64;
canvas.height = 32;

module.exports = {
  render: bytes => {
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
  },
  setSize: (width, height, depth) => {
    console.log({ width, height, depth });
  }
};
