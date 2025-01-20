const BlackjackGame = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    currentBet: 0,
    gameStatus: 'waiting', // waiting, playing, ended
    
    init() {
        // Kiểm tra xem các element cần thiết đã tồn tại chưa
        const requiredElements = [
            'dealerCards',
            'playerCards',
            'dealerValue',
            'playerValue',
            'dealButton',
            'hitButton',
            'standButton',
            'doubleButton',
            'blackjackHistory',
            'blackjackBetAmount'
        ];

        // Kiểm tra từng element
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId)) {
                console.error(`Missing required element: ${elementId}`);
                return;
            }
        }

        this.setupEventListeners();
        this.createDeck();
        this.shuffleDeck();
    },
    
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.deck = [];
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({
                    suit,
                    value,
                    isRed: suit === '♥' || suit === '♦'
                });
            }
        }
    },
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },
    
    setupEventListeners() {
        document.getElementById('dealButton').addEventListener('click', () => this.startGame());
        document.getElementById('hitButton').addEventListener('click', () => this.hit());
        document.getElementById('standButton').addEventListener('click', () => this.stand());
        document.getElementById('doubleButton').addEventListener('click', () => this.double());
        
        // Bet amount controls
        document.getElementById('halfBlackjackBet').addEventListener('click', () => {
            const input = document.getElementById('blackjackBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });
        
        document.getElementById('doubleBlackjackBet').addEventListener('click', () => {
            const input = document.getElementById('blackjackBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });
        
        document.getElementById('maxBlackjackBet').addEventListener('click', () => {
            document.getElementById('blackjackBetAmount').value = balance.toFixed(2);
        });
    },
    
    startGame() {
        const betAmount = parseFloat(document.getElementById('blackjackBetAmount').value);
        if (betAmount > balance) {
            alert('Insufficient balance!');
            return;
        }
        
        this.currentBet = betAmount;
        updateBalance(-betAmount);
        
        // Reset hands
        this.playerHand = [];
        this.dealerHand = [];
        
        // Deal initial cards
        this.playerHand.push(this.drawCard());
        this.dealerHand.push(this.drawCard());
        this.playerHand.push(this.drawCard());
        this.dealerHand.push(this.drawCard());
        
        this.gameStatus = 'playing';
        this.updateUI();
        
        // Enable/disable buttons
        document.getElementById('dealButton').disabled = true;
        document.getElementById('hitButton').disabled = false;
        document.getElementById('standButton').disabled = false;
        document.getElementById('doubleButton').disabled = false;
        
        // Check for natural blackjack
        if (this.calculateHandValue(this.playerHand) === 21) {
            this.stand();
        }
    },
    
    drawCard() {
        if (this.deck.length === 0) {
            this.createDeck();
            this.shuffleDeck();
        }
        return this.deck.pop();
    },
    
    calculateHandValue(hand) {
        let value = 0;
        let aces = 0;
        
        for (let card of hand) {
            if (card.value === 'A') {
                aces++;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                value += 10;
            } else {
                value += parseInt(card.value);
            }
        }
        
        // Add aces
        for (let i = 0; i < aces; i++) {
            if (value + 11 <= 21) {
                value += 11;
            } else {
                value += 1;
            }
        }
        
        return value;
    },
    
    hit() {
        this.playerHand.push(this.drawCard());
        document.getElementById('doubleButton').disabled = true;
        
        const value = this.calculateHandValue(this.playerHand);
        this.updateUI();
        
        if (value > 21) {
            this.endGame('dealer');
        }
    },
    
    stand() {
        // Dealer draws until 17 or higher
        while (this.calculateHandValue(this.dealerHand) < 17) {
            this.dealerHand.push(this.drawCard());
        }
        
        const playerValue = this.calculateHandValue(this.playerHand);
        const dealerValue = this.calculateHandValue(this.dealerHand);
        
        this.updateUI(true);
        
        if (dealerValue > 21 || playerValue > dealerValue) {
            this.endGame('player');
        } else if (dealerValue > playerValue) {
            this.endGame('dealer');
        } else {
            this.endGame('push');
        }
    },
    
    double() {
        if (this.currentBet > balance) {
            alert('Insufficient balance for double!');
            return;
        }
        
        updateBalance(-this.currentBet);
        this.currentBet *= 2;
        
        this.playerHand.push(this.drawCard());
        this.updateUI();
        
        const value = this.calculateHandValue(this.playerHand);
        if (value > 21) {
            this.endGame('dealer');
        } else {
            this.stand();
        }
    },
    
    endGame(result) {
        this.gameStatus = 'ended';
        
        // Tạo message element
        const messageElement = document.createElement('div');
        messageElement.className = `game-result ${result}`;
        
        let resultText = '';
        let amount = '';
        
        if (result === 'player') {
            resultText = 'YOU WIN!';
            amount = `+$${(this.currentBet * 2).toFixed(2)}`;
            updateBalance(this.currentBet * 2);
            this.addToHistory('win');
            this.createWinParticles();
        } else if (result === 'push') {
            resultText = 'PUSH';
            amount = `$${this.currentBet.toFixed(2)} RETURNED`;
            updateBalance(this.currentBet);
            this.addToHistory('push');
        } else {
            resultText = 'DEALER WINS';
            amount = `-$${this.currentBet.toFixed(2)}`;
            this.addToHistory('lose');
        }
        
        messageElement.innerHTML = `
            <div class="result-text">${resultText}</div>
            <div class="result-amount">${amount}</div>
        `;
        
        document.querySelector('.blackjack-table').appendChild(messageElement);
        
        // Show message với animation
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        // Remove message sau 2 giây
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 300);
        }, 2000);
        
        // Reset buttons
        document.getElementById('dealButton').disabled = false;
        document.getElementById('hitButton').disabled = true;
        document.getElementById('standButton').disabled = true;
        document.getElementById('doubleButton').disabled = true;
        
        this.updateUI(true);
    },
    
    updateUI(showAll = false) {
        const dealerCards = document.getElementById('dealerCards');
        const playerCards = document.getElementById('playerCards');
        
        // Kiểm tra xem elements có tồn tại không
        if (!dealerCards || !playerCards) {
            console.error('Required elements not found');
            return;
        }
        
        // Clear current cards
        dealerCards.innerHTML = '';
        playerCards.innerHTML = '';
        
        // Update dealer cards
        this.dealerHand.forEach((card, index) => {
            if (index === 1 && !showAll && this.gameStatus === 'playing') {
                // Tạo lá bài úp cho lá thứ 2
                const cardElement = document.createElement('div');
                cardElement.className = 'card hidden';
                const backDesign = document.createElement('div');
                backDesign.className = 'card-back';
                backDesign.innerHTML = '<i class="fas fa-dice-d20"></i>';
                cardElement.appendChild(backDesign);
                cardElement.style.animationDelay = `${index * 0.1}s`;
                dealerCards.appendChild(cardElement);
            } else {
                const cardElement = this.createCardElement(card);
                if (index === 1 && showAll && this.gameStatus === 'playing') {
                    cardElement.classList.add('revealing');
                }
                cardElement.style.animationDelay = `${index * 0.1}s`;
                dealerCards.appendChild(cardElement);
            }
        });
        
        // Update player cards
        this.playerHand.forEach((card, index) => {
            const cardElement = this.createCardElement(card);
            cardElement.style.animationDelay = `${index * 0.1}s`;
            playerCards.appendChild(cardElement);
        });
        
        // Update values
        const playerValue = this.calculateHandValue(this.playerHand);
        const dealerValue = showAll ? 
            this.calculateHandValue(this.dealerHand) : 
            this.calculateHandValue([this.dealerHand[0]]);
        
        this.animateValue('playerValue', playerValue);
        this.animateValue('dealerValue', dealerValue);
    },
    
    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.isRed ? 'red' : 'black'} dealing`;
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'card-value';
        valueDiv.textContent = card.value;
        
        const suitDiv = document.createElement('div');
        suitDiv.className = 'card-suit';
        suitDiv.textContent = card.suit;
        
        cardDiv.appendChild(valueDiv);
        cardDiv.appendChild(suitDiv);
        
        return cardDiv;
    },
    
    addToHistory(result) {
        const historyList = document.getElementById('blackjackHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${result}`;
        
        let resultText = '';
        switch(result) {
            case 'win':
                resultText = `Win ${(this.currentBet * 2).toFixed(2)}`;
                break;
            case 'lose':
                resultText = `Lose ${this.currentBet.toFixed(2)}`;
                break;
            case 'push':
                resultText = 'Push';
                break;
        }
        
        historyItem.textContent = resultText;
        
        // Thêm vào đầu danh sách thay vì cuối
        if (historyList.firstChild) {
            historyList.insertBefore(historyItem, historyList.firstChild);
        } else {
            historyList.appendChild(historyItem);
        }
        
        // Giới hạn số lượng history items
        while (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
        
        // Thêm animation cho history item mới
        requestAnimationFrame(() => {
            historyItem.style.opacity = '1';
            historyItem.style.transform = 'translateY(0)';
        });
    },
    
    animateValue(elementId, value) {
        const element = document.getElementById(elementId);
        const current = parseInt(element.textContent);
        const diff = value - current;
        const duration = 500; // 500ms
        const start = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.textContent = Math.floor(current + (diff * progress));
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },
    
    createWinParticles() {
        const colors = ['#00FF7F', '#00CC6A', '#00FF99'];
        const particleCount = 30;
        const table = document.querySelector('.blackjack-table');
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position
            const angle = (i / particleCount) * 360;
            const radius = Math.random() * 100 + 50;
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.borderRadius = '50%';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.transform = `translate(${x}px, ${y}px)`;
            
            table.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => particle.remove(), 1000);
        }
    }
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Lấy token từ localStorage
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Lấy số dư từ server
    try {
        const response = await fetch(`${API_URL}/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        balance = data.balance;
        BlackjackGame.init();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});

const socket = io(WS_URL, {
    transports: ['websocket'],
    upgrade: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
let currentRoom = null;

// Socket event handlers
socket.on('roomUpdate', (room) => {
    currentRoom = room;
    updateUI();
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
    // Show error to user
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    // Thử kết nối lại
    setTimeout(() => {
        socket.connect();
    }, 1000);
});

socket.on('connect', () => {
    console.log('Connected to server');
    // Nếu đang trong phòng, join lại
    if (currentRoom) {
        joinRoom(currentRoom.roomId);
    }
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    // Hiển thị thông báo cho user
    showError('Mất kết nối tới server, đang thử kết nối lại...');
});

// UI event handlers
document.getElementById('createRoom').addEventListener('click', () => {
    const roomId = Math.random().toString(36).substr(2, 9);
    joinRoom(roomId);
});

document.getElementById('joinRoom').addEventListener('click', () => {
    const roomId = document.getElementById('roomId').value;
    joinRoom(roomId);
});

document.getElementById('placeBet').addEventListener('click', () => {
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    socket.emit('placeBet', {
        roomId: currentRoom.roomId,
        userId: getUserId(),
        bet: betAmount
    });
});

document.getElementById('hitBtn').addEventListener('click', () => {
    socket.emit('hit', {
        roomId: currentRoom.roomId,
        userId: getUserId()
    });
});

document.getElementById('standBtn').addEventListener('click', () => {
    socket.emit('stand', {
        roomId: currentRoom.roomId,
        userId: getUserId()
    });
});

// Helper functions
function joinRoom(roomId) {
    socket.emit('joinRoom', {
        roomId,
        userId: getUserId(),
        username: getUsername()
    });
}

function updateUI() {
    // Update dealer cards
    const dealerSection = document.querySelector('.dealer-cards');
    dealerSection.innerHTML = '';
    currentRoom.dealerCards.forEach(card => {
        dealerSection.appendChild(createCardElement(card));
    });
    
    // Update players
    const playersSection = document.querySelector('.players-section');
    playersSection.innerHTML = '';
    currentRoom.players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.innerHTML = `
            <h4>${player.username}</h4>
            <div class="bet">Bet: $${player.bet}</div>
            <div class="cards"></div>
        `;
        
        const cardsDiv = playerDiv.querySelector('.cards');
        player.cards.forEach(card => {
            cardsDiv.appendChild(createCardElement(card));
        });
        
        playersSection.appendChild(playerDiv);
    });
    
    // Update controls
    const isMyTurn = currentRoom.currentTurn === getMyPlayerIndex();
    document.getElementById('hitBtn').disabled = !isMyTurn;
    document.getElementById('standBtn').disabled = !isMyTurn;
    document.getElementById('placeBet').disabled = currentRoom.status !== 'waiting';
}

function getMyPlayerIndex() {
    return currentRoom.players.findIndex(p => p.userId === getUserId());
}

function getUserId() {
    return localStorage.getItem('userId');
}

function getUsername() {
    return localStorage.getItem('username');
}