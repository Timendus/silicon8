const {types, run} = require('./test-helper');

run({
  type: types.XOCHIP,
  rom: './tests/scrolling.ch8',
  cycles: 3000,
  test: (ram, display) => {
    describe('scrolling.ch8', () => {
      test('makes a mess of the image by scrolling it 😉', () => {
        // expect(display).toRenderTo('./tests/scrolling.bmp');
        expect(display).toLookLike('./tests/scrolling.bmp');
      });
    });
  }
});
