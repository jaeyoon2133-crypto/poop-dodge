const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// public 폴더 안의 정적 파일(HTML, CSS, JS 등)을 서비스
app.use(express.static('public'));

let waitingPlayer = null; // 대기 중인 플레이어

io.on('connection', (socket) => {
    console.log(`사용자 접속함: ${socket.id}`);

    // 매칭 로직 예시 (2명이 모이면 방 생성)
    if (!waitingPlayer) {
        waitingPlayer = socket;
        socket.emit('message', '대기 중인 상대를 찾는 중...');
    } else {
        const roomName = `room_${waitingPlayer.id}_${socket.id}`;
        
        waitingPlayer.join(roomName);
        socket.join(roomName);

        // 두 사용자에게 게임 시작 알림
        io.to(roomName).emit('start-game', { room: roomName });

        waitingPlayer = null;
    }

    // 클라이언트로부터 게임 데이터(위치, 스킬 등)를 받아서 상대방에게 전달
    socket.on('player-action', (data) => {
        socket.broadcast.emit('opponent-action', data);
    });

    socket.on('disconnect', () => {
        console.log(`사용자 퇴장함: ${socket.id}`);
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});