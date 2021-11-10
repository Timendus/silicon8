module.exports = async io => {

  io.on('connection', socket => {

    socket.on('press', key => {
      key = 1 * key;
      if ( key < 16 && key >= 0 )
        io.emit('press', key);
    });

    socket.on('release', key => {
      key = 1 * key;
      if ( key < 16 && key >= 0 )
        io.emit('release', key);
    });

    socket.on('disconnect', () => {
      io.emit('numClients', io.sockets.size);
    });

    io.emit('numClients', io.sockets.size);

  });

};
