설치 및 배포
1. 압축을 풉니다.
2. server.js, package.json, public/index.html 구조를 유지합니다.
3. Node.js 환경에서 npm install 후 npm start 실행합니다.
4. Render 등 Node 웹 서비스에 배포할 때 Start Command는 npm start 입니다.
5. HTML의 Socket.IO 서버 주소는 현재 기존 주소 https://poop-dodge.onrender.com 을 유지했습니다.
   새 서버 주소로 배포했다면 index.html의 io("https://poop-dodge.onrender.com") 주소를 새 주소로 변경하세요.

멀티 사용법
- 한 명은 '방 만들기'를 누릅니다.
- 표시되는 4자리 코드를 친구에게 전달합니다.
- 친구는 코드를 입력하고 '참가하기'를 누릅니다.
- 두 명이 모이면 자동으로 게임이 시작됩니다.
