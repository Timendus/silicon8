const canvas = document.getElementById("display");
const context = canvas.getContext("2d");

export default {
  render: (width, height, bytes) => {
    canvas.width = width;
    canvas.height = height;
    const imageData = context.createImageData(width, height);
    for (let i = 0; i < height * width; i++) {
      const displayOffset = i * 4;
      const silicon8Offset = i * 3;
      imageData.data[displayOffset + 0] = bytes[silicon8Offset + 0];
      imageData.data[displayOffset + 1] = bytes[silicon8Offset + 1];
      imageData.data[displayOffset + 2] = bytes[silicon8Offset + 2];
      imageData.data[displayOffset + 3] = 0xff;
    }
    context.putImageData(imageData, 0, 0);
  },
};
