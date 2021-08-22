window.addEventListener('load', () => {
  document.querySelector('#template').addEventListener('click', uploadSourceImage);
  document.querySelectorAll('input[type=radio]').forEach(e => e.addEventListener('change', changeSetting));
  document.querySelector('#copy').addEventListener('click', copyResult);
});

const data = {
  method: 'threshold',
  palette: '1',
  resolution: '8x8'
};

/** Generic functions to do with the "file uploads" **/

function uploadFile(handleFile, multiple = false) {
  const input = document.createElement('input');
  input.type  = 'file';
  input.accept = 'image/*';
  input.multiple = multiple;
  input.addEventListener('change', e => handleFile(e.target.files));
  input.click();
}

async function loadImages(files) {
  const filePromises = [];
  for ( let i = 0; i < files.length; i++ ) {
    filePromises[i] = new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.addEventListener('load', e => resolve(e.target.result));
      reader.readAsDataURL(files[i]);
    });
  }
  return Promise.all(filePromises);
}

/** Event handlers **/

function changeSetting(e) {
  data[e.target.getAttribute('name')] = e.target.value;
  if ( data.source ) colourReduceImage();
}

function uploadSourceImage() {
  uploadFile(async files => {
    assert(files.length > 0);
    const fileData = await loadImages(files);
    data.source = {
      fileName: files[0].name,
      image: fileData[0]
    };
    colourReduceImage();
  });
}

function copyResult() {
  if ( data.output )
    navigator.clipboard.writeText(data.output)
    .then(() => alert('Data copied to clipboard!'))
    .catch(e => console.error(e));
}

/** Source image conversion **/

function assert(assertion) {
  if (!assertion) console.error('Assertion failed!');
}

async function colourReduceImage() {
  const pixels = await base64imgToPixels(data.source.image);

  // Render the source image
  const source = document.querySelector('#template');
  source.style.backgroundImage = `url("${pixelsToBase64img(pixels)}")`;
  source.classList.add('loaded');

  // Threshold the image into pure black and white to get rid of
  // compression artifacts and the likes
  switch(data.method) {
    case 'threshold':
      threshold(pixels, palette(data.palette));
      break;
    case 'dithering':
      dithering(pixels, palette(data.palette));
      break;
  }

  // Render the target image
  const target = document.querySelector('#image');
  target.style.backgroundImage = `url("${pixelsToBase64img(pixels)}")`;
  target.classList.add('loaded');

  // Output the binary data
  const planes = pixelsToPlanes(pixels)
                   .filter(plane => plane.some(v => v != 0));
  const sprites = planesToSprites(planes, pixels.width, pixels.height);

  data.output = sprites.map((sprite, i) =>
    `# Sprite ${i+1} (${sprite.length} ${sprite.length > 1 ? 'layers' : 'layer'}, ${sprite[0].length} bytes per layer)\n` +
    sprite.map(layer =>
      makeGroups(Array.from(layer), 16)
      .map(line =>
       line.map(num => `0x${toHexString(num)}`)
           .join(' ')
      )
      .join('\n')
    ).join('\n')
  ).join('\n\n');

  const table = document.querySelector('#table');
  table.innerHTML = `<pre>${data.output}</pre>`;
}

function makeGroups(array, length) {
  const result = [];
  for ( let i = 0; i < array.length; i += length ) {
    result.push(array.slice(i, i + length));
  }
  return result;
}

function toHexString(num) {
  return (num < 16 ? '0' : '') + num.toString(16);
}

/** Tranform base64 images to and from ImageData **/

async function base64imgToPixels(base64) {
  return new Promise((resolve, reject) => {
    var img = document.createElement('img');
    img.src = base64;
    img.addEventListener('load', () => {
      const canvas  = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width  = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    });
  });
}

function pixelsToBase64img(pixels) {
  const canvas  = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width  = pixels.width;
  canvas.height = pixels.height;
  context.putImageData(pixels, 0, 0);
  return canvas.toDataURL();
}

/** Image transformation functions **/

// Threshold the image to the given palette
function threshold(pixels, palette) {
  for ( let i = 0; i < pixels.data.length; i += 4 ) {
    const newColour = nearestColour([pixels.data[i+0], pixels.data[i+1], pixels.data[i+2]], palette);
    pixels.data[i+0] = newColour[0];
    pixels.data[i+1] = newColour[1];
    pixels.data[i+2] = newColour[2];
    pixels.data[i+3] = 0xFF;
  }
  return pixels;
}

// Floyd-Steinberg dither the image to given palette
function dithering(pixels, palette) {
  for ( let y = 0; y < pixels.height; y++ ) {
    for ( let x = 0; x < pixels.width; x++ ) {
      const pixelColour = getPixel(pixels, x, y);
      const newColour = nearestColour(pixelColour, palette);
      setPixel(pixels, x, y, newColour);
      const error = pixelColour.map((v, i) => v - newColour[i]);
      addError(pixels, x+1,   y, error, 7/16);
      addError(pixels, x-1, y+1, error, 3/16);
      addError(pixels,   x, y+1, error, 5/16);
      addError(pixels, x+1, y+1, error, 1/16);
    }
  }
  return pixels;
}

function addError(pixels, x, y, error, factor) {
  const index = (y * pixels.width + x) * 4;
  pixels.data[index + 0] += error[0] * factor;
  pixels.data[index + 1] += error[1] * factor;
  pixels.data[index + 2] += error[2] * factor;
}

function getPixel(pixels, x, y) {
  const index = (y * pixels.width + x) * 4;
  const r = pixels.data[index + 0];
  const g = pixels.data[index + 1];
  const b = pixels.data[index + 2];
  return [r,g,b];
}

function setPixel(pixels, x, y, [ r, g, b ]) {
  const index = (y * pixels.width + x) * 4;
  pixels.data[index + 0] = r;
  pixels.data[index + 1] = g;
  pixels.data[index + 2] = b;
  pixels.data[index + 3] = 0xFF;
}

function nearestColour(colour, palette) {
  let distance = Infinity;
  let selectedColour = null;
  for ( let i = 0; i < palette.length; i++ ) {
    const rDist = Math.pow(Math.abs(colour[0] - palette[i][0]), 2);
    const gDist = Math.pow(Math.abs(colour[1] - palette[i][1]), 2);
    const bDist = Math.pow(Math.abs(colour[2] - palette[i][2]), 2);
    const myDistance = rDist + gDist + bDist;
    if ( myDistance < distance ) {
      distance = myDistance;
      selectedColour = palette[i];
    }
  }
  return selectedColour;
}

// Map RGB data back to four Silicon8 planes
function pixelsToPlanes(pixels) {
  let bitmask = 128;
  let planeIndex = 0;
  const byteLength = pixels.data.length / 4 / 8;
  const planes = [
    new Uint8Array(byteLength),
    new Uint8Array(byteLength),
    new Uint8Array(byteLength),
    new Uint8Array(byteLength)
  ];

  for ( let i = 0; i < pixels.data.length; i += 4 ) {
    const myColour = [ pixels.data[i+0], pixels.data[i+1], pixels.data[i+2] ];
    const myPlanes = colourToPlanes(myColour);
    planes[0][planeIndex] |= myPlanes[3] == 1 ? bitmask : 0;
    planes[1][planeIndex] |= myPlanes[2] == 1 ? bitmask : 0;
    planes[2][planeIndex] |= myPlanes[1] == 1 ? bitmask : 0;
    planes[3][planeIndex] |= myPlanes[0] == 1 ? bitmask : 0;
    bitmask = bitmask >> 1;
    if ( bitmask == 0 ) {
      bitmask = 128;
      planeIndex++;
    }
  }
  return planes;
}

// Cut up Silicon8 planes in sprites of the selected resolution
function planesToSprites(planes, width, height) {
  // What is the desired sprite resolution?
  const [xRes, yRes] = data.resolution.split('x')
                                      .map(i => 1*i);
  const sprites = [];
  // Go through all the sprites in order
  for ( let y = 0; y < height; y += yRes ) {
    for ( let x = 0; x < width / 8; x += xRes / 8 ) {
      sprites.push(
        planes.map(plane => { // For each plane...
          // ...gather the right bytes that make up this sprite
          const index = y * width / 8 + x;
          const myPlane = [];
          for ( let rows = 0; rows < yRes; rows++ ) {
            for ( let cols = 0; cols < xRes / 8; cols++ ) {
              myPlane.push(
                plane[index + rows * width / 8 + cols]
              );
            }
          }
          return myPlane;
        })
      );
    }
  }
  return sprites;
}

/** Palette definitions **/

const colours = {
  // Palette zero: four shades of gray
  0: [ 0x00, 0x00, 0x00 ],
  1: [ 0xFF, 0xFF, 0xFF ],
  2: [ 0xAA, 0xAA, 0xAA ],
  3: [ 0x55, 0x55, 0x55 ],

  // Palette one: red, green, blue, yellow
  4: [ 0xFF, 0x00, 0x00 ],
  5: [ 0x00, 0xFF, 0x00 ],
  6: [ 0x00, 0x00, 0xFF ],
  7: [ 0xFF, 0xFF, 0x00 ],

	// Palette two: bordeaux, olive, navy, orange
	8: [ 0x88, 0x00, 0x00 ],
	9: [ 0x00, 0x88, 0x00 ],
	10: [ 0x00, 0x00, 0x88 ],
	11: [ 0x88, 0x88, 0x00 ],

	// Palette three: pink and cyan, purple and ocean
	12: [ 0xFF, 0x00, 0xFF ],
	13: [ 0x00, 0xFF, 0xFF ],
	14: [ 0x88, 0x00, 0x88 ],
	15: [ 0x00, 0x88, 0x88 ]
};

function palette(plane) {
  const valid = [];
  for ( let i = 0; i < 16; i++ ) {
    if ( (i & plane) == i ) valid.push(i);
  }
  return valid.map(v => colours[v]);
}

function colourToPlanes(colour) {
  // Find the right key in our colours map
  const key = Object.keys(colours).find(key =>
    colours[key].every((channel,index) => channel == colour[index])
  );
  // Integer key to array of bits
  return (1 * key).toString(2).padStart(4, "0").split("");
}
