const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "https://xchatappp.netlify.app/",  // Allow requests from this origin
    methods: ["GET", "POST"]
  }
});



const rooms = {};

io.on("connection", (socket) => {
  console.log("Client connected");

  let currentRoom = null;
  let username = null;

  socket.on("join", (data) => {
    const { username: newUsername, roomKey } = data;
    username = newUsername;
    currentRoom = roomKey;
    console.log(`client is ${username}`);

    if (!rooms[currentRoom]) {
      rooms[currentRoom] = [];
    }

    // Store user information in the room
    rooms[currentRoom].push({ username, socketId: socket.id });
    socket.join(currentRoom);  // Join the socket.io room

    // Send 'joined' message along with the users array
    io.to(currentRoom).emit("joined", {
      username,
      message: `${username} joined`,
      users: rooms[currentRoom].map((user) => user.username),
    });
  });

  socket.on("message", (data) => {
    if (currentRoom) {
      io.to(currentRoom).emit("message", data);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client ${username} disconnected`);
    if (currentRoom && username) {
      // Remove the user from the room
      rooms[currentRoom] = rooms[currentRoom].filter(
        (user) => user.socketId !== socket.id
      );

      // Update the user list for the room
      io.to(currentRoom).emit("joined", {
        username,
        message: `${username} left`,
        users: rooms[currentRoom].map((user) => user.username),
      });

      // If the room is empty, delete the room
      if (rooms[currentRoom].length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});


const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Socket.IO server is listening on port ${port}`);
});
