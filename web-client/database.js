/**
 * Logic to query the CHIP-8 database to find information on a given ROM
 */

module.exports = class Chip8Database {

  async findProgram(rom) {
    const hash = await this._sha1Hash(rom);
    await this.initialize();
    if (!(hash in this._hashes)) throw "ROM wasn't found in database";
    const programMeta = this._programs[this._hashes[hash]];
    const romMeta = programMeta.roms[hash];
    return new Program(this, programMeta, romMeta);
  }

  async initialize() {
    if (!this._programs || !this._hashes || !this._platforms) {
      const hashesRequest = await fetch("https://raw.githubusercontent.com/chip-8/chip-8-database/master/database/sha1-hashes.json");
      const programsRequest = await fetch("https://raw.githubusercontent.com/chip-8/chip-8-database/master/database/programs.json");
      const platformsRequest = await fetch("https://raw.githubusercontent.com/chip-8/chip-8-database/master/database/platforms.json");
      this._hashes = await hashesRequest.json() || {};
      this._programs = await programsRequest.json();
      this._platforms = await platformsRequest.json();
    }
  }
  
  // Returns a SHA1 hash of the given binary data
  async _sha1Hash(data) {
    const hash = await crypto.subtle.digest("SHA-1", data);
    const array = Array.from(new Uint8Array(hash));
    return array.map(b => b.toString(16)
                          .padStart(2, "0"))
                .join("");
  }

}

class Program {

  constructor(database, program, rom) {
    Object.assign(this, program);
    this._database = database;
    this.rom = rom;
    this.allAuthors = this._merge('authors');
    this.allImages = this._merge('images');
    this.allURLs = this._merge('urls');
  }

  getPreferredPlatform(supportedPlatforms) {
    const platform = this.rom.platforms.find(p => p in supportedPlatforms);
    return {
      ...this._database._platforms.find(p => p.id == platform),
      code: supportedPlatforms[platform]
    };
  }

  _merge(field) {
    return [...new Set([...(this[field] || []), ...(this.rom[field] || [])])]
  }

}
