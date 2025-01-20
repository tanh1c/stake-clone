const socket = io('https://stake-clone-backend.onrender.com');
let currentRoom = null;

const sounds = {
    card: new Audio('sounds/card.mp3'),
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3'),
    bet: new Audio('sounds/bet.mp3')
};

function playSound(soundName) {
    sounds[soundName].currentTime = 0;
    sounds[soundName].play();
}

// Xử lý các sự kiện socket
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('error', (data) => {
    alert(data.message);
});

socket.on('roomCreated', (data) => {
    currentRoom = data.roomId;
    updateUI();
});

socket.on('playerJoined', (data) => {
    updatePlayersUI(data.players);
});

socket.on('betPlaced', (data) => {
    updatePlayersUI(data.players);
});

socket.on('gameStarted', (data) => {
    playSound('card');
    updateGameUI(data);
});

socket.on('gameState', (data) => {
    updateGameUI(data);
    if (data.turnTimeout) {
        updateTimer(data.turnTimeout);
    }
});

socket.on('gameEnded', (data) => {
    const currentPlayer = data.players.find(p => p.userId === localStorage.getItem('userId'));
    playSound(currentPlayer.balance > 0 ? 'win' : 'lose');
    showResults(data.players);
});

socket.on('roomList', (rooms) => {
    const roomsDiv = document.getElementById('rooms');
    roomsDiv.innerHTML = '';
    
    rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-item';
        roomDiv.innerHTML = `
            <div class="room-info">
                <span>Room: ${room.roomId}</span>
                <span>Players: ${room.players.length}/7</span>
                <span>Bet: $${room.minBet} - $${room.maxBet}</span>
            </div>
            <button onclick="joinRoom('${room.roomId}')" 
                    ${room.players.length >= 7 ? 'disabled' : ''}>
                Join Room
            </button>
        `;
        roomsDiv.appendChild(roomDiv);
    });
});

// Thêm auto-refresh room list
setInterval(() => {
    if (!currentRoom) {
        socket.emit('getRoomList');
    }
}, 5000);

// Thêm xử lý chat ở client
function sendMessage() {
    const message = document.getElementById('chatInput').value;
    if (!message.trim()) return;
    
    socket.emit('sendMessage', {
        roomId: currentRoom,
        userId: localStorage.getItem('userId'),
        message
    });
    
    document.getElementById('chatInput').value = '';
}

socket.on('newMessage', (data) => {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <span class="username">${data.username}:</span>
        <span class="message">${data.message}</span>
        <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
    `;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// UI functions
function updateUI() {
    if (currentRoom) {
        document.getElementById('roomId').textContent = `Room: ${currentRoom}`;
        document.getElementById('waitingArea').style.display = 'block';
        document.getElementById('gameArea').style.display = 'none';
    }
}

function updatePlayersUI(players) {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';
    
    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.innerHTML = `
            <span>${player.username}</span>
            <span>$${player.balance}</span>
            <span>${player.ready ? '✓' : ''}</span>
        `;
        playersList.appendChild(playerDiv);
    });
}

function updateGameUI(data) {
    const { players, currentTurn } = data;
    const gameArea = document.getElementById('gameArea');
    gameArea.style.display = 'block';
    document.getElementById('waitingArea').style.display = 'none';

    // Update each player's cards and info
    players.forEach(player => {
        const playerDiv = document.getElementById(`player-${player.userId}`);
        if (!playerDiv) return;

        const cardsHtml = player.cards.map(card => `<div class="card">${card}</div>`).join('');
        playerDiv.querySelector('.cards').innerHTML = cardsHtml;
        playerDiv.querySelector('.score').textContent = calculateScore(player.cards);
        
        // Highlight current turn
        playerDiv.classList.toggle('active', player.userId === currentTurn);
    });
}

function showResults(players) {
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-overlay';
    resultsDiv.innerHTML = `
        <div class="results-box">
            <h2>Game Results</h2>
            ${players.map(p => `
                <div class="result-item">
                    <span>${p.username}</span>
                    <span>${p.balance > 0 ? '+' : ''}$${p.balance}</span>
                </div>
            `).join('')}
            <button onclick="leaveRoom()">Leave Room</button>
        </div>
    `;
    document.body.appendChild(resultsDiv);
}

// Game actions
function createRoom() {
    const minBet = document.getElementById('minBet').value;
    const maxBet = document.getElementById('maxBet').value;
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please login first');
        window.location.href = 'auth.html';
        return;
    }

    socket.emit('createRoom', {
        userId: userId,
        minBet: Number(minBet) || 1,
        maxBet: Number(maxBet) || 1000
    });
}

function joinRoom(roomId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please login first');
        window.location.href = 'auth.html';
        return;
    }

    socket.emit('joinRoom', {
        userId: userId,
        roomId
    });
}

function placeBet(amount) {
    socket.emit('placeBet', {
        roomId: currentRoom,
        userId: localStorage.getItem('userId'),
        amount
    });
}

function hit() {
    socket.emit('hit', {
        roomId: currentRoom,
        userId: localStorage.getItem('userId')
    });
}

function stand() {
    socket.emit('stand', {
        roomId: currentRoom,
        userId: localStorage.getItem('userId')
    });
}

function leaveRoom() {
    socket.emit('leaveRoom', {
        roomId: currentRoom,
        userId: localStorage.getItem('userId')
    });
    currentRoom = null;
    location.reload();
}

function updateTimer(endTime) {
    const timerDiv = document.getElementById('timer');
    
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const timeLeft = new Date(endTime).getTime() - now;
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            timerDiv.textContent = 'Time\'s up!';
            return;
        }
        
        const seconds = Math.floor(timeLeft / 1000);
        timerDiv.textContent = `Time left: ${seconds}s`;
    }, 1000);
} 