const os = require("os");
const bodyParser = require("body-parser");
const startProxy = require("./proxy");

const WebSocket = require("ws");
const http = require("http");

const express = require("express");

const app = express();
const app2 = express();
startProxy(3001, () => {
  console.log("Proxy started at port 3001");
});

const webServer = http.createServer(app);
const keystrokeServer = http.createServer(app2);

const keysWss = new WebSocket.Server({
  server: keystrokeServer,
  path: "/keystroke"
});

const webWss = new WebSocket.Server({
  server: webServer,
  path: "/web"
});

const clients = [];

let currentUserId = "partners\\user002";

// Get user info from the os module.
// Not used.
const getUserInfo = () => {
  const u = os.userInfo({ encoding: "utf8" });
  console.log("user info:", u);
};

webWss.on("connection", ws => {
  console.log("web socket server onconnection");
  clients.push(ws);
  getUserInfo();

  ws.on("disconnect", () => {
    console.log("web socket disconnected");
  });

  ws.on("message", msg => {
    msg = JSON.parse(msg);
    if (typeof msg === "object" && msg.eventType) {
      const { eventType, data } = msg;
      console.log("data", data);
      console.log("eventType", eventType);
      if (eventType === "getUserId") {
        sendMessage({ eventType: "getUserId", data });
      } else {
        sendMessage({ eventType, data });
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
      sendMessage({ eventType: event, data });
  }
};

// DO NOTHING. Not needed.
const openSocket = () => {};

// CLOSE THE SOCKET
const closeSocket = () => {
  webWss.close();
};

// Prepare the message format and send it socket clients.
const sendMessage = ({ eventType, data }) => {
  console.log("sending event", eventType);
  console.log("sending data", data);
  if (!eventType) {
    return;
  }

  if (eventType === "login") {
    currentUserId = data || currentUserId;
  }

  let payload = JSON.stringify({
    eventType,
    data: currentUserId
  });

  if(eventType === 'version') {
    payload = JSON.stringify({
      eventType,
      data
    });
  }
  console.log("payload", payload);

  clients.forEach(c => c.send(payload));
};

// Start the server.
webServer.listen(3000, () => {
  console.log("Web WebSocket started on port 3000.");
  console.log("Socket Control Panel is available at http://localhost:3000");
});

keystrokeServer.listen(3003, () => {
  console.log("Keystroke server started 3003");
});
