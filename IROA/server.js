const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("matched");
    waitingUser.emit("matched");

    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  // Señales de WebRTC
  socket.on("signal", (data) => {
    if (socket.partner) {
      socket.partner.emit("signal", data);
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partnerDisconnected");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) waitingUser = null;

    console.log("Usuario desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor iniciado");
});