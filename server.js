const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const app = express();
app.use(express.static(__dirname));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map();

const getRoom = (name) => {
  if (!rooms.has(name)) {
    rooms.set(name, { clients: new Set(), history: [] });
  }
  return rooms.get(name);
};

const broadcast = (room, payload) => {
  const data = JSON.stringify(payload);
  room.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
};

wss.on("connection", (socket, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const roomName = url.searchParams.get("room") || "lobby";
  const room = getRoom(roomName);
  const clientId = crypto.randomUUID();

  socket.roomName = roomName;
  socket.clientId = clientId;
  room.clients.add(socket);

  socket.send(
    JSON.stringify({
      type: "welcome",
      clientId,
      room: roomName,
      history: room.history,
    })
  );

  socket.on("message", (buffer) => {
    let payload;
    try {
      payload = JSON.parse(buffer.toString());
    } catch (error) {
      return;
    }

    if (payload.type !== "message") {
      return;
    }

    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text) {
      return;
    }

    const message = {
      type: "message",
      id: crypto.randomUUID(),
      room: roomName,
      senderId: clientId,
      name: payload.name || "Guest",
      text,
      timestamp: new Date().toISOString(),
    };

    room.history.push(message);
    if (room.history.length > 50) {
      room.history.shift();
    }

    broadcast(room, message);
  });

  socket.on("close", () => {
    room.clients.delete(socket);
    if (room.clients.size === 0) {
      rooms.delete(roomName);
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Chat app listening on http://localhost:${port}`);
});
