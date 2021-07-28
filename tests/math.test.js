const {types, run} = require('./test-helper');

run({
  type: types.BLINDVIP,
  rom: './tests/math.ch8',
  cycles: 60,
  test: (ram, display) => {
    describe('math.ch8', () => {
      test('does subtraction right', () => {
        expect(ram[0x400]).toBe(35);
      });
      test('does the other subtraction right', () => {
        expect(ram[0x401]).toBe(20);
      });
      test('does addition right', () => {
        expect(ram[0x402]).toBe(65);
      });
      test('does OR right', () => {
        expect(ram[0x403]).toBe(63);
      });
      test('does AND right', () => {
        expect(ram[0x404]).toBe(2);
      });
      test('does XOR right', () => {
        expect(ram[0x405]).toBe(61);
      });
      test('does shift right right', () => {
        expect(ram[0x406]).toBe(25);
      });
      test('does shift left right', () => {
        expect(ram[0x407]).toBe(100);
      });
      test('does addition to i right', () => {
        expect(ram[0x408]).toBe(0xAA);
      });
    });
  }
});
