const {types, run} = require('./test-helper');

run({
  type: types.BLINDVIP,
  rom: './tests/math.ch8',
  cycles: 100,
  test: (ram, display) => {
    describe('math.ch8', () => {

      test('does OR right', () => {
        expect(ram[0x404]).toBe(63);
      });
      test('does AND right', () => {
        expect(ram[0x406]).toBe(2);
      });
      test('does XOR right', () => {
        expect(ram[0x408]).toBe(61);
      });
      test('does addition to i right', () => {
        expect(ram[0x410]).toBe(0xAA);
      });

      describe('without complications', () => {
        test('does subtraction right', () => {
          expect(ram[0x400]).toBe(35);
          expect(ram[0x40E]).toBe(1);
        });
        test('does the other subtraction right', () => {
          expect(ram[0x401]).toBe(20);
          expect(ram[0x40F]).toBe(1);
        });
        test('does addition right', () => {
          expect(ram[0x402]).toBe(65);
          expect(ram[0x403]).toBe(0);
        });
        test('does shift right right', () => {
          expect(ram[0x40A]).toBe(25);
          expect(ram[0x40B]).toBe(0);
        });
        test('does shift left right', () => {
          expect(ram[0x40C]).toBe(100);
          expect(ram[0x40D]).toBe(0);
        });
      });

      describe('with complications (overflow, carry, etc)', () => {
        test('does subtraction right', () => {
          expect(ram[0x411]).toBe(0xD4); // Why?
          expect(ram[0x419]).toBe(0);
        });
        test('does the other subtraction right', () => {
          expect(ram[0x412]).toBe(0x9C);
          expect(ram[0x41A]).toBe(0);
        });
        test('does addition right', () => {
          expect(ram[0x413]).toBe(0x2C);
          expect(ram[0x414]).toBe(1);
        });
        test('does shift right right', () => {
          expect(ram[0x415]).toBe(1);
          expect(ram[0x416]).toBe(1);
        });
        test('does shift left right', () => {
          expect(ram[0x417]).toBe(0x90);
          expect(ram[0x418]).toBe(1);
        });
      });

    });
  }
});
