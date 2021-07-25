const {types, run} = require('./test-helper');

run({
  type: types.BLINDVIP,
  rom: './tests/fibonacci.ch8',
  cycles: 60,
  test: (ram, display) => {
    describe('fibonacci.ch8', () => {
      test('calculates the 12th Fibonacci number', () => {
        expect(ram[0x400]).toBe(144);
      });
    });
  }
});
