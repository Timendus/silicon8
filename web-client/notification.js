module.exports = class Notification {

  constructor(message) {
    this._element = document.createElement('div');
    document.querySelector('.notifications').appendChild(this._element);
    this._element.innerText = message;
    setTimeout(() => this._element.classList.add('active'), 0);
    setTimeout(() => this.close(), 3000);
  }

  close() {
    if ( this._element.classList.contains('active') ) {
      this._element.classList.remove('active');
      this._element.addEventListener('transitionend', () => this._element.remove());
    } else {
      this._element.remove();
    }
  }

}
