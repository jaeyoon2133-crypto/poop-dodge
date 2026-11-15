const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

app.use(express.static("public"));

const rooms = new Map();

function makeRoomCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

io.on("connection", (socket) => {
  console.log("접속:", socket.id);

  socket.on("createRoom", () => {
    // 한 소켓은 한 번에 한 방만 사용
    leaveCurrentRoom(socket);
    const roomId = makeRoomCode();
    rooms.set(roomId, { players: [socket.id] });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.emit("roomCreated", { roomId });
    console.log(`방 생성: ${roomId}`);
  });

  socket.on("joinRoom", (rawRoomId) => {
    const roomId = String(rawRoomId || "").trim();
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit("roomNotFound");
      return;
    }
    if (room.players.length >= 2 || room.players.includes(socket.id)) {
      socket.emit("roomFull");
      return;
    }

    leaveCurrentRoom(socket);
    room.players.push(socket.id);
    socket.join(roomId);
    socket.data.roomId = roomId;

    io.to(roomId).emit("gameStart", { roomId });
    console.log(`방 참가 및 게임 시작: ${roomId}`);
  });

  socket.on("playerMove", (data = {}) => {
    const roomId = socket.data.roomId;
    if (!roomId || data.roomId !== roomId || !rooms.has(roomId)) return;
    socket.to(roomId).emit("opponentMove", { x: Number(data.x) || 0 });
  });

  socket.on("castSkill", (data = {}) => {
    const roomId = socket.data.roomId;
    if (!roomId || data.roomId !== roomId || !rooms.has(roomId)) return;
    socket.to(roomId).emit("receiveSkill", {
      type: data.type,
      value: data.value
    });
  });

  socket.on("disconnect", () => {
    console.log("퇴장:", socket.id);
    leaveCurrentRoom(socket, true);
  });
});

function leaveCurrentRoom(socket, disconnected = false) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (room) {
    room.players = room.players.filter(id => id !== socket.id);
    if (room.players.length === 0) {
      rooms.delete(roomId);
    } else if (!disconnected) {
      io.to(roomId).emit("opponentDisconnected");
      rooms.delete(roomId);
    } else {
      io.to(roomId).emit("opponentDisconnected");
      rooms.delete(roomId);
    }
  }
  socket.leave(roomId);
  delete socket.data.roomId;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`멀티 서버 실행 중: ${PORT}`);
});
