const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
  path: '/keystroke',
});

wss.on('connection', ws => {
  console.log('on connection');

  ws.on('message', msg => {
    console.log('ws msg', msg);
  });
});



server.listen(3000, () => {
  console.log('server started');
});

