const WebSocket = require('ws');
const port = process.env.PORT || 3000;

const server = new WebSocket.Server({ port });

let gameSessions = []; // Array to hold game sessions

server.on('connection', socket => {
    // Check if there's an available game session with fewer than 2 players
    let sessionToJoin = gameSessions.find(session => session.players.length < 2);

    if (!sessionToJoin) {
        // If no available session, create a new one
        sessionToJoin = {
            players: [],
            currentPlayer: 0
        };
        gameSessions.push(sessionToJoin);
    }

    // Add the current socket to the session with fewer than 2 players
    sessionToJoin.players.push(socket);

    // Determine the player number (1 or 2) based on session index
    const playerNumber = sessionToJoin.players.length;

    // Notify the player of their player number and symbol ('X' for player 1, 'O' for player 2)
    socket.send(JSON.stringify({ type: 'welcome', player: playerNumber, symbol: playerNumber === 1 ? 'X' : 'O' }));

    socket.on('message', message => {
        const data = JSON.parse(message);

        if (data.type === 'move') {
            // Broadcast the move to all players in the session
            sessionToJoin.players.forEach(player => {
                player.send(JSON.stringify(data));
            });
            sessionToJoin.currentPlayer = (sessionToJoin.currentPlayer + 1) % 2;
        }

        if (data.type === 'reset') {
            // Reset the game for all players in the session
            sessionToJoin.players.forEach(player => {
                player.send(JSON.stringify(data));
            });
            sessionToJoin.currentPlayer = 0;
        }
    });

    socket.on('close', () => {
        // Remove the player from their session when they disconnect
        sessionToJoin.players = sessionToJoin.players.filter(player => player !== socket);

        // If a session becomes empty, remove it from gameSessions
        if (sessionToJoin.players.length === 0) {
            gameSessions = gameSessions.filter(session => session !== sessionToJoin);
        }
    });
});

console.log(`WebSocket server is running on ws://localhost:${port}`);
