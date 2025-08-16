export default class Input {

  constructor() {
    this._keyListener = null;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding( 'utf8' );
    process.stdin.on('data', key => this._handleKeyPress(key));
  }

  addKeyListener(func) {
    this._keyListener = func;
  }

  _handleKeyPress(key) {
    switch(key) {
      case '\u0003':
      case '\u0071':
      case '\u001B':
        return process.exit();
    }

    if ( !this._keyListener ) return;

    switch(key) {
      case '\u001B\u005B\u0041':
        return this._keyListener('up');
      case '\u001B\u005B\u0042':
        return this._keyListener('down');
      case '\u001B\u005B\u0044':
        return this._keyListener('left');
      case '\u001B\u005B\u0043':
        return this._keyListener('right');
      case '\u000D':
        return this._keyListener('enter');
    }
  }

}
