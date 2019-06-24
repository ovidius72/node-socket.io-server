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

// server.on('connection', socket => {
//   console.log('on server connection');
//   socket.on('data', data => {
//     console.log('received data');
//     const msg2 = Buffer.from(data).toString('utf8');
//     console.log('msg2', msg2);
//   });

//   socket.on('connect', d => {
//     console.log('connected to server', d);
//   });

// });


server.listen(3000, () => {
  console.log('server started');
});

