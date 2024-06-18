const boxes = document.querySelectorAll(".box");
const msgcon = document.querySelector(".msg-container");
const msg = document.querySelector("#msg");
const newbtn = document.querySelector("#new-btn");
const rstbtn = document.querySelector("#reset-btn");
const roomInput = document.querySelector("#room-input");
const joinBtn = document.querySelector("#join-btn");

const winpatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let playerSymbol = ""; // 'X' or 'O'
let currentTurn = 'X'; // Track whose turn it is
let count = 0; // to track the draw game

let socket = null;
let player = 0;

function initWebSocket() {
    socket = new WebSocket('wss://tic-tac-toe-1-fd3m.onrender.com');

    socket.addEventListener('message', event => {
        const data = JSON.parse(event.data);
        if (data.type === 'welcome') {
            player = data.player;
            playerSymbol = player === 1 ? 'X' : 'O';
            console.log(`You are player ${player}, symbol: ${playerSymbol}`);
        } else if (data.type === 'move') {
            const box = document.querySelectorAll('.box')[data.index];
            box.innerText = data.symbol;
            box.disabled = true;
            count++;
            checkWinner();
            currentTurn = currentTurn === 'X' ? 'O' : 'X'; // Switch turn
        } else if (data.type === 'reset') {
            resetgame();
        }
    });

    socket.addEventListener('open', event => {
        enableboxes(); // Enable all boxes when the WebSocket connection is established
    });
}

function joinRoom(roomId) {
    socket.send(JSON.stringify({ type: 'join', roomId }));
}

function createRoom() {
    socket.send(JSON.stringify({ type: 'create' }));
}

boxes.forEach((box, index) => {
    box.addEventListener('click', () => {
        if (playerSymbol === currentTurn && box.innerText === "") { // Check if the box is empty
            box.innerText = playerSymbol;
            box.disabled = true;
            count++; // Increment count only after a successful move
            socket.send(JSON.stringify({ type: 'move', index, symbol: playerSymbol }));
            checkWinner();
        }
    });
});

rstbtn.addEventListener("click", () => {
    socket.send(JSON.stringify({ type: 'reset' }));
});

newbtn.addEventListener("click", () => {
    socket.send(JSON.stringify({ type: 'reset' }));
});

joinBtn.addEventListener("click", () => {
    const roomId = roomInput.value.trim();
    if (roomId !== '') {
        joinRoom(roomId);
    }
});

function resetgame() {
    currentTurn = 'X';
    count = 0;
    enableboxes();
    msgcon.classList.add("hide");
}

function enableboxes() {
    boxes.forEach(box => {
        box.disabled = false;
        box.innerText = "";
    });
}

function disableboxes() {
    boxes.forEach(box => {
        box.disabled = true;
    });
}

function gamedraw() {
    msg.innerText = "Game is a Draw";
    msgcon.classList.remove("hide");
    disableboxes();
}

function showwinner(winner) {
    msg.innerText = `Winner is ${winner}`;
    msgcon.classList.remove("hide");
    disableboxes();
}

function checkWinner() {
    let filledBoxes = 0; // Count how many boxes are filled
    for (let box of boxes) {
        if (box.innerText !== "") {
            filledBoxes++;
        }
    }

    for (let pattern of winpatterns) {
        let pos1val = boxes[pattern[0]].innerText;
        let pos2val = boxes[pattern[1]].innerText;
        let pos3val = boxes[pattern[2]].innerText;

        if (pos1val && pos1val === pos2val && pos2val === pos3val) {
            showwinner(pos1val);
            return true; // Return true if there's a winner
        }
    }

    if (filledBoxes === 9) { // Check if all boxes are filled
        gamedraw();
        return false; // Return false as it's a draw
    }

    return false; // Return false as there's no winner or draw yet
}

initWebSocket();
