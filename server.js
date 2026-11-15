const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// itch.io에서 실행되는 게임도 Render의 Socket.IO 서버에 접속할 수 있도록 허용
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.status(200).send('ok'));

// roomId -> Set(socketId)
const rooms = new Map();
// socketId -> roomId
const playerRooms = new Map();

function leaveRoom(socket, notify = true) {
  const roomId = playerRooms.get(socket.id);
  if (!roomId) return;
  const members = rooms.get(roomId);
  socket.leave(roomId);
  playerRooms.delete(socket.id);
  if (members) {
    members.delete(socket.id);
    if (notify && members.size > 0) io.to(roomId).emit('opponentDisconnected');
    if (members.size === 0) rooms.delete(roomId);
  }
}

io.on('connection', (socket) => {
  console.log('접속:', socket.id);

  socket.on('joinRoom', (rawRoomId) => {
    const roomId = String(rawRoomId || '').trim().slice(0, 40);
    if (!roomId) return;

    // 같은 소켓의 중복 입장 방지
    leaveRoom(socket, false);

    let members = rooms.get(roomId);
    if (!members) {
      members = new Set();
      rooms.set(roomId, members);
    }

    if (members.size >= 2) {
      socket.emit('roomFull');
      return;
    }

    members.add(socket.id);
    playerRooms.set(socket.id, roomId);
    socket.join(roomId);

    if (members.size === 1) {
      socket.emit('waiting');
    } else {
      io.to(roomId).emit('gameStart');
      console.log(`게임 시작: ${roomId}`);
    }
  });

  socket.on('playerMove', (data = {}) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId || data.roomId !== roomId || typeof data.x !== 'number') return;
    socket.to(roomId).emit('opponentMove', { x: data.x });
  });

  socket.on('castSkill', (data = {}) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId || data.roomId !== roomId) return;
    socket.to(roomId).emit('receiveSkill', {
      roomId,
      type: data.type,
      value: data.value
    });
  });

  socket.on('disconnect', () => {
    console.log('퇴장:', socket.id);
    leaveRoom(socket, true);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`서버 실행 중: ${PORT}`);
});
