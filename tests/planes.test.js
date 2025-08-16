import run from "./test-helper.js";
import types from "../docs/js/shared/types";

run({
  type: types.XOCHIP,
  rom: "./tests/planes.ch8",
  cycles: 50,
  test: (ram, display) => {
    describe("planes.ch8", () => {
      test("shows sprites on different layers with different sizes", () => {
        // expect(display).toRenderTo("./tests/planes.bmp");
        expect(display).toLookLike("./tests/planes.bmp");
      });
    });
  },
});
