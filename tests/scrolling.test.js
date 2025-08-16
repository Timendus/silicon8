import run from "./test-helper.js";
import types from "../docs/js/shared/types";

run({
  type: types.XOCHIP,
  rom: "./tests/scrolling.ch8",
  cycles: 3000,
  test: (ram, display) => {
    describe("scrolling.ch8", () => {
      test("makes a mess of the image by scrolling it 😉", () => {
        // expect(display).toRenderTo('./tests/scrolling.bmp');
        expect(display).toLookLike("./tests/scrolling.bmp");
      });
    });
  },
});

run({
  type: types.SCHIP,
  rom: "./tests/scrolling-schip.ch8",
  cycles: 3000,
  test: (ram, display) => {
    describe("scrolling-schip.ch8", () => {
      test("produces a coherent image by scrolling squares in", () => {
        // expect(display).toRenderTo('./tests/scrolling-schip.bmp');
        expect(display).toLookLike("./tests/scrolling-schip.bmp");
      });
    });
  },
});
