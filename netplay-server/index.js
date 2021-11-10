const express = require('express');
const app = express();
const server = require('http').Server(app);
const keypressAPI = require('./keypress-api');

const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

const config = {
  "server": {
    "port": 3000,
    "verbose": true
  }
};

// Mount events API using socket.io
keypressAPI(io.of('/keypresses'));

server.listen(config.server.port, () =>
  console.log(`Server is listening on port ${config.server.port}`));
