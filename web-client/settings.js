module.exports = (instance, keyboard, gamepad) => {
  const settings = document.querySelector('.settings');
  let program;

  settings.classList.toggle('gamepad-found', gamepad.present());
  const interval = setInterval(() => {
    settings.classList.toggle('gamepad-found', gamepad.present());
  }, 500);

  function close() {
    clearInterval(interval);
    settings.classList.remove('active');
    settings.classList.remove('gamepad-found');
    settings.scrollTop = 0;
  }
  
  for (const button of settings.querySelectorAll('button.is-success')) {
    button.addEventListener('click', () => {
      const type = settings.querySelector('input[name="interpreter"]:checked').value;
      const speed = settings.querySelector('select[name="speed"]').value;
      instance.loadProgram(type, program);
      instance.setCyclesPerFrame(speed);
      keyboard.setMapping(getKeyChoices());
      gamepad.setMapping(getButtonChoices());
      close();
      instance.start();
    });
  }

  for (const button of settings.querySelectorAll('button.is-error')) {
    button.addEventListener('click', () => close());
  }
  for (const button of settings.querySelectorAll('#keys button')) {
    button.addEventListener('click', async () => {
      button.innerText = 'Press...';
      [device, key] = await gamepad.getNextButtonPress();
      button.innerText = `🎮${device + 1} 🔘${key}`;
      const previous = settings.querySelector(`input[value="${device}-${key}"]`);
      settings.querySelector(`input[name="${button.id}"`).value = `${device}-${key}`;
      previous.value = '-';
      settings.querySelector(`button#${previous.name}`).innerText = 'Not set';
    });
  }

  window.addEventListener('keyup', e => {
    if (e.code == "Escape") close();
  });

  return ( metadata, prgm ) => {
    program = prgm;
    settings.querySelector('#info').innerHTML = programMetadata(metadata) + romMetadata(metadata.rom);
    settings.querySelector('input[name="interpreter"][checked]').checked = false;
    settings.querySelector(`input[name="interpreter"][value="${metadata.platform.code}"`).checked = true;
    const tickrate = metadata.rom?.tickrate || metadata.platform.defaultTickrate;
    if (tickrate) settings.querySelector('select[name="speed"]').value = tickrate;
    if (metadata.rom?.keys) setKeyChoices(metadata.rom.keys);
    settings.classList.add('active');
  }
}

function programMetadata(program) {
  return `
    <div class="nes-container">
      <h3>Program info</h3>
      <dl>
        <dt>Title:</dt>
        <dd>${program.title}</dd>

        ${program.authors && program.authors.length > 0 ? `
          <dt>Author(s):</dt>
          <dd>${program.authors.join(" & ")}</dd>
        ` : ''}

        ${program.release ? `
          <dt>Release:</dt>
          <dd>${program.release}</dd>
        ` : ''}
      </dl>

      ${program.description ? program.description.split("\n\n").map(t => `<p>${t.replace('\n', '<br/>')}</p>`).join("") : ''}

      ${program.urls && program.urls.length > 0 ? `
        <p>Links:</p>
        <ul>
          ${program.urls.map(u => `<li><a href="${u}" target="_blank">${u}</a></li>`).join("")}
        </ul>
      ` : ''}
    </div>
  `;
}

function romMetadata(rom) {
  if (!rom) return '';
  if (!(rom.embeddedTitle || rom.authors || rom.release || rom.description || rom.urls)) return '';
  return `
    <div class="nes-container">
      <h3>ROM info</h3>
      <dl>
        ${rom.embeddedTitle ? `
          <dt>Embedded:</dt>
          <dd>${rom.embeddedTitle}</dd>
        ` : ''}

        ${rom.authors && rom.authors.length > 0 ? `
          <dt>Author(s):</dt>
          <dd>${rom.authors.join(" & ")}</dd>
        ` : ''}

        ${rom.release ? `
          <dt>Release:</dt>
          <dd>${rom.release}</dd>
        ` : ''}
      </dl>

      ${rom.description ? rom.description.split("\n\n").map(t => `<p>${t.replace('\n', '<br/>')}</p>`).join("") : ''}

      ${rom.urls && rom.urls.length > 0 ? `
        <p>Links:</p>
        <ul>
          ${rom.urls.map(u => `<li><a href="${u}" target="_blank">${u}</a></li>`).join("")}
        </ul>
      ` : ''}
    </div>
  `;
}

function setKeyChoices(keys) {
  document.querySelector('#keys select[name="up"]').value = keys.up || "false";
  document.querySelector('#keys select[name="down"]').value = keys.down || "false";
  document.querySelector('#keys select[name="left"]').value = keys.left || "false";
  document.querySelector('#keys select[name="right"]').value = keys.right || "false";
  document.querySelector('#keys select[name="a"]').value = keys.a || "false";
  document.querySelector('#keys select[name="b"]').value = keys.b || "false";
  document.querySelector('#keys p').innerText = 'Set by ROM metadata';
}

function getKeyChoices() {
  return {
    "up": document.querySelector('#keys select[name="up"]').value,
    "down": document.querySelector('#keys select[name="down"]').value,
    "left": document.querySelector('#keys select[name="left"]').value,
    "right": document.querySelector('#keys select[name="right"]').value,
    "a": document.querySelector('#keys select[name="a"]').value,
    "b": document.querySelector('#keys select[name="b"]').value,
  }
}

function getButtonChoices() {
  const buttons = ["up", "down", "left", "right", "a", "b"];
  const mapping = {};
  for ( const button of buttons ) {
    const gamepadSetting = document.querySelector(`#keys input[name="gamepad-${button}"]`).value;
    [gamepadIndex, gamepadButton] = gamepadSetting.split('-');
    if (gamepadIndex == '' || gamepadButton == '') continue;
    const chip8Key = document.querySelector(`#keys select[name="${button}"]`).value;
    mapping[gamepadIndex] ??= {};
    mapping[gamepadIndex][gamepadButton] = chip8Key;
  }
  return mapping;
}
