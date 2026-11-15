const socket = io();

// 서버로부터 게임 시작 신호를 받았을 때
socket.on('start-game', (data) => {
    console.log("게임이 시작되었습니다!", data.room);
    // TODO: 로비 화면을 숨기고 게임 캔버스를 활성화하는 로직 작성
});

// 내 플레이어의 상태(위치 등)를 서버로 전송
function sendMyState(stateData) {
    socket.emit('player-action', stateData);
}

// 상대방의 상태를 받아 화면에 반영
socket.on('opponent-action', (data) => {
    // TODO: 상대방 캐릭터 위치 업데이트 로직 작성
});