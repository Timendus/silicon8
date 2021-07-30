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
        for ( x = 0; x < 8; x++ )
          for ( y = 0; y < 32; y++ )
            if ( x == 2 && y == 20 ) {
              expect(display[y * 8 + x]).toBe(0b00001000);
            } else {
              expect(display[y * 8 + x]).toBe(0);
            }
      });
    }
  });
});
