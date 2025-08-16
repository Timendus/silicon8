import run from "./test-helper.js";
import types from "../docs/js/shared/types";

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
