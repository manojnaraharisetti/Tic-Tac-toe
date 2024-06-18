const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid'); // For generating unique room IDs
const port = process.env.PORT || 3000;

const server = new WebSocket.Server({ port });

let gameSessions = []; // Array to hold game sessions

server.on('connection', socket => {
    socket.on('message', message => {
        const data = JSON.parse(message);

        if (data.type === 'create') {
            // Create a new game session (room)
            const roomID = uuidv4(); // Generate a unique room ID
            const newSession = {
                roomId: roomID,
                players: [socket],
                currentPlayer: 0
            };
            gameSessions.push(newSession);

            // Notify the creator with the room ID and their player number
            socket.send(JSON.stringify({ type: 'roomCreated', roomId: roomID, player: 1 }));

        } else if (data.type === 'join') {
            // Join an existing game session (room) based on room ID
            const roomID = data.roomId;
            const sessionToJoin = gameSessions.find(session => session.roomId === roomID);

            if (sessionToJoin && sessionToJoin.players.length < 2) {
                // Add the current socket to the session if it exists and is not full
                sessionToJoin.players.push(socket);

                // Determine the player number (1 or 2) based on session index
                const playerNumber = sessionToJoin.players.length;

                // Notify the player with their player number and symbol ('X' or 'O')
                socket.send(JSON.stringify({ type: 'joined', player: playerNumber, symbol: playerNumber === 1 ? 'X' : 'O' }));
            } else {
                // Room doesn't exist or is full, notify the user accordingly
                socket.send(JSON.stringify({ type: 'roomFull' }));
            }
        } else if (data.type === 'move') {
            // Broadcast the move to all players in the session
            const session = gameSessions.find(session => session.players.includes(socket));
            session.players.forEach(player => {
                player.send(JSON.stringify(data));
            });
            session.currentPlayer = (session.currentPlayer + 1) % 2;

        } else if (data.type === 'reset') {
            // Reset the game for all players in the session
            const session = gameSessions.find(session => session.players.includes(socket));
            session.players.forEach(player => {
                player.send(JSON.stringify(data));
            });
            session.currentPlayer = 0;
        }
    });

    socket.on('close', () => {
        // Remove the player from their session when they disconnect
        gameSessions.forEach(session => {
            session.players = session.players.filter(player => player !== socket);

            // If a session becomes empty, remove it from gameSessions
            if (session.players.length === 0) {
                gameSessions = gameSessions.filter(s => s !== session);
            }
        });
    });
});

console.log(`WebSocket server is running on ws://localhost:${port}`);
