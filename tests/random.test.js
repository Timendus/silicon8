const {types, run} = require('./test-helper');

describe('random.ch8', () => {
  run({
    type: types.BLINDVIP,
    rom: './tests/random.ch8',
    cycles: 4,
    callbacks: {
      randomByte: () => 20
    },
    test: (ram, display) => {
      test('shows a dot at 20,20 given randomByte produces 20', () => {
        expectPixel(display, 20, 20, 64, 32);
      });
    }
  });
});

describe('random-hires.ch8', () => {
  run({
    type: types.SCHIP,
    rom: './tests/random-hires.ch8',
    cycles: 5,
    callbacks: {
      randomByte: () => 50
    },
    test: (ram, display) => {
      test('shows a dot at 50,50 given randomByte produces 50', () => {
        expectPixel(display, 50, 50, 128, 64);
      });
    }
  });
});

function expectPixel(display, xPos, yPos, w, h) {
  for ( x = 0; x < (w / 8); x++ )
    for ( y = 0; y < h; y++ )
      if ( x == Math.floor(xPos / 8) && y == yPos ) {
        expect(display[y * (w / 8) + x]).toBe(0b10000000 >> xPos % 8);
      } else {
        expect(display[y * (w / 8) + x]).toBe(0);
      }
}
