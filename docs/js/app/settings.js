export default (instance) => {
  const settings = document.querySelector(".settings");
  let program;

  settings.querySelector("button").addEventListener("click", () => {
    const type = settings.querySelector(
      'input[name="interpreter"]:checked'
    ).value;
    const speed = settings.querySelector('select[name="speed"]').value;
    instance.loadProgram(type, program);
    instance.setCyclesPerFrame(speed);
    settings.classList.remove("active");
    instance.start();
  });

  return (prgm) => {
    program = prgm;
    settings.classList.add("active");
  };
};
