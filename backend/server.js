const WebSocket = require('ws');
const port = process.env.PORT || 3000;

const server = new WebSocket.Server({ port });

let players = [];
let currentPlayer = 0;

server.on('connection', socket => {
    if (players.length < 2) {
        players.push(socket);
        socket.send(JSON.stringify({ type: 'welcome', player: players.length }));
    } else {
        socket.send(JSON.stringify({ type: 'full' }));
        socket.close();
    }

    socket.on('message', message => {
        const data = JSON.parse(message);

        if (data.type === 'move') {
            players.forEach(player => {
                player.send(JSON.stringify(data));
            });
            currentPlayer = (currentPlayer + 1) % 2;
        }

        if (data.type === 'reset') {
            players.forEach(player => {
                player.send(JSON.stringify(data));
            });
            currentPlayer = 0;
        }
    });

    socket.on('close', () => {
        players = players.filter(player => player !== socket);
    });
});

console.log(`WebSocket server is running on ws://localhost:${port}`);
