module.exports = message => {
  const notification = document.querySelector('.notification');
  notification.innerText = message;
  notification.classList.add('active');
  setTimeout(() => notification.classList.remove('active'), 5000);
}
