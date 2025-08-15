const { types, run } = require("./test-helper");

run({
  type: types.BLINDVIP,
  rom: "./tests/abc.ch8",
  cycles: 30,
  test: (ram, display) => {
    describe("abc.ch8", () => {
      test("shows ABC on the display", () => {
        // expect(display).toRenderTo("./tests/abc.bmp");
        expect(display).toLookLike("./tests/abc.bmp");
      });
    });
  },
});
