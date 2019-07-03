const os = require("os");
const bodyParser = require("body-parser");

const WebSocket = require("ws");
const http = require("http");

const express = require("express");

const app = express();
const app2 = express();

const webServer = http.createServer(app);
const keystrokeServer = http.createServer(app2);
let wsSender;

// const io = require('socket.io');

const keysWss = new WebSocket.Server({
  server: keystrokeServer,
  path: "/keystroke"
});

const webWss = new WebSocket.Server({
  server: webServer,
  path: "/web"
  // server
});

// const ioWeb = io(http, {
//   path: '/web',
// });

// const ioKeystroke = io(http, {
//   path: '/keystroke',
// });

let currentUserId = "u001";

// Get user info from the os module.
// Not used.
const getUserInfo = () => {
  const u = os.userInfo({ encoding: "utf8" });
  console.log("user info:", u);
};

webWss.on("connection", ws => {
  // ioWeb.on("connection", socket => {
  console.log("web socket server onconnection");
  wsSender = ws;
  getUserInfo();

  ws.on("disconnect", () => {
    console.log("web socket disconnected");
  });

  ws.on("message", msg => {
    msg = JSON.parse(msg);
    console.log("received msg", msg);
    if (typeof msg === 'object' && msg.event) {
      console.log('in block');
      const {event, data} = msg;
      console.log("data", data);
      console.log("event", event);
      if (event === "getUserId") {
        sendMessage({ event: "getUserId", data });
      } else {
        sendMessage({ event, data });
      }
    }
  });
});

keysWss.on("connection", kSocket => {
  console.log("keystroke socket onconnection");

  kSocket.on("disconnect", () => {
    console.log("keystroke socket disconnected");
  });

  kSocket.on("connected", () => {
    console.log("keystroke socket connected");
  });

  kSocket.on("message", msg => {
    // kSocket.onevent = msg => {
    console.log("received keystroke message");
    console.log(msg);
  });
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * Create an index.html page at localhost:3000.
 * The page can be used to simulate user interactio with the PC.
 * e.g: login with an arbitraty userID, logout, send the userId to the socket.
 * simulate socket connection closed/open.
 */
app.get("/", (_, res) => {
  res.sendFile(__dirname + "/index.html");
});

/**
 * @POST: Endpoint for the front-end to send messages that will be proxied to the socket server.
 */
app.post("/command/", (req, res) => {
  const payload = req.body;
  console.log("received a command request", payload);
  if (payload && payload.event) {
    handleCommand(payload);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

/**
 * Manage proxies messages.
 */
const handleCommand = async ({ event, data }) => {
  console.log("data", data);
  console.log("event", event);
  switch (event) {
    case "open": {
      openSocket();
      break;
    }
    case "close": {
      closeSocket();
      break;
    }
    default:
      sendMessage({ event, data });
  }
};

// DO NOTHING. Not needed.
const openSocket = () => {};

// CLOSE THE SOCKET
const closeSocket = () => {
  webWss.close();
};

// Prepare the message format and send it socket clients.
const sendMessage = ({ event, data }) => {
  console.log("sending data", data);
  console.log("sending event", event);
  if (!event) {
    return;
  }
  console.log("currentUserId", currentUserId);

  const payload = JSON.stringify({
    event, 
    data: currentUserId,
  });

  // webWss.emit(event, { data: currentUserId });
  if(wsSender && wsSender.send) {
    wsSender.send(payload);
  }
  // webWss.send(payload);
  if (event === "login") {
    currentUserId = data || currentUserId;
  }
};

// Start the server.
webServer.listen(3000, () => {
  console.log("WebSocket Server started");
});

keystrokeServer.listen(3001, () => {
  console.log("Keystroke server started");
});
