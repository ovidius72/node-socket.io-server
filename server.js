const express = require("express");
const app = express();
const http = require("http").Server(app);
const bodyParser = require("body-parser");
const os = require('os');
const io = require('socket.io');

const ioWeb = io(http, {
  path: '/web',
});

const ioKeystroke = io(http, {
  path: '/keystroke',
});

let currentUserId = 'u001';


// Get user info from the os module.
// Not used.
const getUserInfo = () => {
  const u  = os.userInfo({encoding: 'utf8'});
  console.log("user info:", u);
}

ioWeb.on("connection", socket => {
  console.log("socket connected", socket.connected);
  getUserInfo();

  socket.on("disconnect", () => {
    console.log("socket disconnected", socket.connected);
  });

  socket.onevent = function(msg) {
    console.log("received msg", msg);
    const {data: msgData} = msg;
    const [event, data] = msgData;
    if(event === 'getUserId'){
      sendMessage({event: 'getUserId', data });
    } else {
      sendMessage({event,data});
    }
  };
});

ioKeystroke.on('connection', kSocket => {
  console.log('keystroke socket connected');

  kSocket.on('disconnect', () => {
    console.log('keystroke socket disconnected');
  })

  kSocket.on("connected", () => {
    console.log('keystroke socket connected');
  });

  kSocket.onevent = msg => {
    console.log('received keystroke message');
    console.log(msg);
  }

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
const handleCommand = async ( {event, data}  ) => {
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
      sendMessage({event, data});
  }
};

// DO NOTHING. Not needed.
const openSocket = () => {};

// CLOSE THE SOCKET
const closeSocket = () => {
  ioWeb.close();
};

// Prepare the message format and send it socket clients.
const sendMessage = ({event, data}) => {
console.log("data", data);
console.log("event", event);
  if(!event) {
    return;
  }
  console.log("currentUserId", currentUserId);

  ioWeb.emit(event, { data: currentUserId });
  if(event === 'login') {
    currentUserId = data || currentUserId;
  }
};


// Start the server.
http.listen(3000, () => {
  console.log("Server started");
});
