const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3000 });

let players = [];
let currentPlayer = 0; // Track the current player

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
        
        // Handle game moves
        if (data.type === 'move') {
            // Broadcast move to all players
            players.forEach(player => {
                player.send(JSON.stringify(data));
            });
            // Switch current player
            currentPlayer = (currentPlayer + 1) % 2;
        }

        // Handle game reset
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

console.log('WebSocket server is running on ws://localhost:8080');
