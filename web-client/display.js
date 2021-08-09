const canvas  = document.getElementById('display');
const context = canvas.getContext('2d');

module.exports = {
  render: (width, height, bytes) => {
    canvas.width = width;
    canvas.height = height;
    const imageData = context.createImageData(width, height);
    for ( let y = 0; y < height; y++ ) {
      for ( let x = 0; x < width; x++ ) {
        const memoryOffset  = Math.floor(y * width / 8 + x / 8);
        const pixelOffset   = x % 8;
        const displayOffset = y * width * 4 + x * 4;
        imageData.data[displayOffset+0] = bytes[memoryOffset] & (0b10000000 >> pixelOffset) ? 0xFF : 0x00;
        imageData.data[displayOffset+1] = bytes[memoryOffset] & (0b10000000 >> pixelOffset) ? 0xAA : 0x00;
        imageData.data[displayOffset+2] = bytes[memoryOffset] & (0b10000000 >> pixelOffset) ? 0x44 : 0x00;
        imageData.data[displayOffset+3] = 0xDD;
      }
    }
    context.putImageData(imageData, 0, 0);
  }
};
