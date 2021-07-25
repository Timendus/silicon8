const {types, run} = require('./test-helper');

run({
  type: types.BLINDVIP,
  rom: './tests/abc.ch8',
  cycles: 30,
  test: (ram, display) => {
    describe('abc.ch8', () => {
      test('shows ABC on the display', () => {
        expect(Array.from(display.slice(12*8, 17*8))).toEqual([
          0, 0, 0, 0b00110011, 0b10001110, 0, 0, 0,
          0, 0, 0, 0b01001010, 0b01010000, 0, 0, 0,
          0, 0, 0, 0b01111011, 0b10010000, 0, 0, 0,
          0, 0, 0, 0b01001010, 0b01010000, 0, 0, 0,
          0, 0, 0, 0b01001011, 0b10001110, 0, 0, 0,
        ]);
      });
    });
  }
});
