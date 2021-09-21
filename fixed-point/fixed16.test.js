const {types, run} = require('../tests/test-helper');

const scale = 8; // 1/2^8
function bytesAsFixed(a, b) {
  let number = a * (1 << scale) + b;
  if ( number & (1 << 15) ) number -= (1 << 16);
  return rounded(number/(1<<scale));
  //let fixed = (a * (1 << scale) + b) / (1 << scale);
  //if ( a & 128 ) fixed = fixed - (1 << scale);
  //return rounded(fixed);
}
function bytesAsInt16(a, b) {
  let res = a * 256 + b;
  if ( a & 128 ) res = res - (1 << 16);
  return res;
}
function rounded(x, factor=100) {
  return Math.round(x * factor) / factor;
}

run({
  type: types.BLINDVIP,
  rom: './fixed-point/fixed16.ch8',
  cycles: 1000,
  test: (ram, display) => {
    describe('fixed16.ch8', () => {
      test('loads the fixed point numbers correctly', () => {
        expect(bytesAsFixed(ram[0x400], ram[0x401])).toBe(5.6);
        expect(bytesAsFixed(ram[0x402], ram[0x403])).toBe(7.9);
      });
      test('adds fixed point numbers correctly', () => {
        expect(bytesAsFixed(ram[0x404], ram[0x405])).toBe(5.6 + 7.9);
      });
      test('subtracts fixed point numbers correctly', () => {
        expect(bytesAsFixed(ram[0x406], ram[0x407])).toBe(rounded(5.6 - 7.9));
      });
      test('converts integers to fixed point correctly', () => {
        expect(bytesAsFixed(ram[0x408], ram[0x409])).toBe(18);
      });
      test('converts fixed point to integers correctly', () => {
        expect(bytesAsInt16(ram[0x40A], ram[0x40B])).toBe(13);
      });
      test('multiplies regular integers correctly', () => {
        expect(bytesAsInt16(ram[0x40C], ram[0x40D])).toBe(10);
        expect(bytesAsInt16(ram[0x40E], ram[0x40F])).toBe(1359);
        expect(bytesAsInt16(ram[0x410], ram[0x411])).toBe(13590);
      });
      test('multiplies fixed point numbers correctly', () => {
        // Precision isn't as good, unfortunately
        expect(rounded(bytesAsFixed(ram[0x412], ram[0x413]), 10)).toBe(rounded(5.6 * 7.9, 10));
      });
      test('multiplies negative numbers correctly', () => {
        // int16 to fixed16
        expect(bytesAsFixed(ram[0x414], ram[0x415])).toBe(-40);
        // mult-int16 -40 * 10
        expect(bytesAsInt16(ram[0x416], ram[0x417])).toBe(-400);
        // static input
        expect(bytesAsFixed(ram[0x418], ram[0x419])).toBe(-2.25);
        // mult-fixed16 -2.25 * -40 = 90
        expect(bytesAsFixed(ram[0x41A], ram[0x41B])).toBe(-2.25 * -40);
      });
    });
  }
});
