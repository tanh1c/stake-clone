class BlackjackMultiplayerGame {
    constructor() {
        this.socket = io(API_URL.replace('/api', ''));
        this.setupSocketListeners();
        this.setupUIHandlers();
        this.gameState = {
            roomId: null,
            players: new Map(),
            currentTurn: null,
            mySocketId: null,
            dealer: null
        };
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.joinRoom();
        });

        this.socket.on('roomJoined', (data) => {
            this.gameState.roomId = data.roomId;
            this.updateRoomInfo(data);
        });

        this.socket.on('playerJoined', (data) => {
            this.addPlayer(data.player);
        });

        this.socket.on('gameStarting', (data) => {
            this.handleGameStart(data);
        });

        this.socket.on('betPlaced', (data) => {
            this.updatePlayerBet(data);
        });

        this.socket.on('gameStarted', (data) => {
            this.handleGameStart(data);
        });

        this.socket.on('cardDealt', (data) => {
            this.handleCardDealt(data);
        });

        this.socket.on('nextTurn', (data) => {
            this.handleNextTurn(data);
        });

        this.socket.on('gameResult', (data) => {
            this.handleGameResult(data);
        });

        this.socket.on('newMessage', (data) => {
            this.addChatMessage(data);
        });

        // Add more socket listeners
    }

    setupUIHandlers() {
        document.getElementById('placeBet').addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('betAmount').value);
            this.socket.emit('placeBet', { amount });
        });

        document.getElementById('hitBtn').addEventListener('click', () => {
            this.socket.emit('hit');
        });

        document.getElementById('standBtn').addEventListener('click', () => {
            this.socket.emit('stand');
        });

        document.getElementById('sendChat').addEventListener('click', () => {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (message) {
                this.socket.emit('sendMessage', { message });
                input.value = '';
            }
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('sendChat').click();
            }
        });

        // Add more UI handlers
    }

    // Game logic methods
    joinRoom() {
        const token = localStorage.getItem('token');
        this.socket.emit('joinRoom', { token });
    }

    updateRoomInfo(data) {
        document.getElementById('roomId').textContent = data.roomId;
        document.getElementById('playerCount').textContent = data.players.length;
        this.renderPlayers(data.players);
    }

    handleGameStart(data) {
        this.gameState.dealer = data.dealer;
        this.gameState.currentTurn = data.currentTurn;
        
        // Update UI
        this.renderDealer();
        this.renderPlayers(data.players);
        this.updateControls();
        
        document.getElementById('gameMessage').textContent = 'Game Started!';
    }

    handleCardDealt(data) {
        const { socketId, card, score, status } = data;
        const playerSpot = document.querySelector(`[data-player="${socketId}"]`);
        
        if (playerSpot) {
            this.addCardToPlayer(playerSpot, card);
            playerSpot.querySelector('.score').textContent = score;
            
            if (status === 'bust') {
                playerSpot.classList.add('bust');
            }
        }
    }

    handleNextTurn(data) {
        this.gameState.currentTurn = data.currentTurn;
        this.updateControls();
        this.highlightCurrentPlayer();
    }

    handleGameResult(data) {
        const { socketId, username, result, winAmount } = data;
        const playerSpot = document.querySelector(`[data-player="${socketId}"]`);
        
        if (playerSpot) {
            const resultDiv = document.createElement('div');
            resultDiv.className = `result ${result}`;
            resultDiv.textContent = `${result.toUpperCase()}: $${winAmount}`;
            playerSpot.appendChild(resultDiv);
        }

        if (socketId === this.gameState.mySocketId) {
            // Update local balance
            const balance = parseFloat(document.getElementById('balance').textContent);
            document.getElementById('balance').textContent = (balance + winAmount).toFixed(2);
        }
    }

    addChatMessage(data) {
        const { username, message, timestamp } = data;
        const chatMessages = document.getElementById('chatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `
            <span class="chat-username">${username}:</span>
            <span class="chat-text">${message}</span>
            <span class="chat-time">${new Date(timestamp).toLocaleTimeString()}</span>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Rendering methods...
    renderDealer() {
        const dealerArea = document.querySelector('.dealer-area');
        dealerArea.innerHTML = '';
        
        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'dealer-cards';
        
        this.gameState.dealer.cards.forEach(card => {
            cardsDiv.appendChild(this.createCardElement(card));
        });
        
        dealerArea.appendChild(cardsDiv);
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}`;
        cardDiv.innerHTML = `
            <div class="card-value">${card.value}</div>
            <div class="card-suit">${card.suit}</div>
        `;
        return cardDiv;
    }

    // Other methods...
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlackjackMultiplayerGame();
}); 