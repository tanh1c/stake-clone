const API_URL = 'https://stake-clone-backend.onrender.com/api';

const HiLoGame = {
    deck: [],
    currentCard: null,
    previousCard: null,
    nextCard: null,
    currentBet: 0,
    currentMultiplier: 1,
    gameStatus: 'waiting', // waiting, playing, ended
    
    init() {
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
                    isRed: suit === '♥' || suit === '♦',
                    numericValue: this.getNumericValue(value)
                });
            }
        }
    },
    
    getNumericValue(value) {
        if (value === 'A') return 1;
        if (['J', 'Q', 'K'].includes(value)) return 10;
        return parseInt(value);
    },
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },
    
    setupEventListeners() {
        document.getElementById('startHilo').addEventListener('click', () => this.startGame());
        document.getElementById('higherButton').addEventListener('click', () => this.guessHigher());
        document.getElementById('lowerButton').addEventListener('click', () => this.guessLower());
        document.getElementById('cashoutButton').addEventListener('click', () => this.cashout());
        
        // Bet amount controls
        document.getElementById('halfHiloBet').addEventListener('click', () => {
            const input = document.getElementById('hiloBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });
        
        document.getElementById('doubleHiloBet').addEventListener('click', () => {
            const input = document.getElementById('hiloBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });
        
        document.getElementById('maxHiloBet').addEventListener('click', () => {
            document.getElementById('hiloBetAmount').value = balance.toFixed(2);
        });
    },
    
    startGame() {
        const betAmount = parseFloat(document.getElementById('hiloBetAmount').value);
        if (betAmount > balance) {
            alert('Insufficient balance!');
            return;
        }
        
        this.currentBet = betAmount;
        updateBalance(-betAmount);
        
        // Reset game state
        this.previousCard = null;
        this.currentCard = this.drawCard();
        this.nextCard = this.drawCard();
        this.currentMultiplier = 1;
        this.gameStatus = 'playing';
        
        // Reset total multiplier display
        document.getElementById('totalMultiplier').textContent = '1.00x';
        
        // Update UI
        this.updateUI();
        
        // Enable/disable buttons
        document.getElementById('startHilo').disabled = true;
        document.getElementById('higherButton').disabled = false;
        document.getElementById('lowerButton').disabled = false;
        document.getElementById('cashoutButton').disabled = false;
    },
    
    drawCard() {
        if (this.deck.length === 0) {
            this.createDeck();
            this.shuffleDeck();
        }
        return this.deck.pop();
    },
    
    calculateMultiplier(isHigher) {
        const currentValue = this.currentCard.numericValue;
        let possibleHigher = 0;
        let possibleLower = 0;
        
        // Calculate remaining possibilities
        this.deck.forEach(card => {
            if (card.numericValue > currentValue) possibleHigher++;
            if (card.numericValue < currentValue) possibleLower++;
        });
        
        // Tính toán tỉ lệ dựa trên giá trị của lá bài hiện tại
        let higherMultiplier, lowerMultiplier;
        
        if (currentValue === 1) { // Ace
            higherMultiplier = (this.deck.length / possibleHigher).toFixed(2);
            lowerMultiplier = '13.00'; // Không thể có lá nào nhỏ hơn
        } else if (currentValue === 10) { // J, Q, K
            higherMultiplier = '13.00'; // Không thể có lá nào lớn hơn
            lowerMultiplier = (this.deck.length / possibleLower).toFixed(2);
        } else {
            higherMultiplier = possibleHigher > 0 ? 
                (this.deck.length / possibleHigher).toFixed(2) : 
                ((13 - currentValue) + Math.random()).toFixed(2); // Tỉ lệ ngẫu nhiên cao
            
            lowerMultiplier = possibleLower > 0 ? 
                (this.deck.length / possibleLower).toFixed(2) : 
                (currentValue + Math.random()).toFixed(2); // Tỉ lệ ngẫu nhiên cao
        }
        
        // Hiển thị multiplier
        document.getElementById('higherMultiplier').textContent = `${higherMultiplier}x`;
        document.getElementById('lowerMultiplier').textContent = `${lowerMultiplier}x`;
        
        // Trả về multiplier dạng số
        return isHigher ? parseFloat(higherMultiplier) : parseFloat(lowerMultiplier);
    },
    
    guessHigher() {
        this.makeGuess(true);
    },
    
    guessLower() {
        this.makeGuess(false);
    },
    
    makeGuess(isHigher) {
        const multiplier = this.calculateMultiplier(isHigher);
        const currentValue = this.currentCard.numericValue;
        
        // Kiểm tra điều kiện đặc biệt
        if ((currentValue === 1 && !isHigher) || (currentValue === 10 && isHigher)) {
            this.endGame('lose');
            return;
        }
        
        const isCorrect = isHigher ? 
            this.nextCard.numericValue > this.currentCard.numericValue :
            this.nextCard.numericValue < this.currentCard.numericValue;
        
        if (isCorrect) {
            this.currentMultiplier *= multiplier;
            // Update total multiplier với animation
            const totalMultiplierElement = document.getElementById('totalMultiplier');
            totalMultiplierElement.parentElement.classList.add('updating');
            totalMultiplierElement.textContent = `${this.currentMultiplier.toFixed(2)}x`;
            setTimeout(() => {
                totalMultiplierElement.parentElement.classList.remove('updating');
            }, 300);
            
            this.previousCard = this.currentCard;
            this.currentCard = this.nextCard;
            this.nextCard = this.drawCard();
            this.updateUI();
        } else {
            this.endGame('lose');
        }
    },
    
    cashout() {
        const winAmount = this.currentBet * this.currentMultiplier;
        updateBalance(winAmount);
        this.endGame('win', winAmount);
    },
    
    endGame(result, amount = 0) {
        this.gameStatus = 'ended';
        
        // Create result message
        const messageElement = document.createElement('div');
        messageElement.className = `game-result ${result}`;
        
        let resultText = '';
        let amountText = '';
        
        if (result === 'win') {
            resultText = 'YOU WIN!';
            amountText = `+$${amount.toFixed(2)}`;
            this.addToHistory('win', amount);
        } else {
            resultText = 'YOU LOSE!';
            amountText = `-$${this.currentBet.toFixed(2)}`;
            this.addToHistory('lose', this.currentBet);
        }
        
        messageElement.innerHTML = `
            <div class="result-text">${resultText}</div>
            <div class="result-amount">${amountText}</div>
        `;
        
        document.querySelector('.hilo-table').appendChild(messageElement);
        
        // Show message with animation
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        // Remove message after 2 seconds
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 300);
        }, 2000);
        
        // Reset buttons
        document.getElementById('startHilo').disabled = false;
        document.getElementById('higherButton').disabled = true;
        document.getElementById('lowerButton').disabled = true;
        document.getElementById('cashoutButton').disabled = true;
        
        this.updateUI(true);
    },
    
    updateUI(showAll = false) {
        // Update previous card
        const previousCardElement = document.getElementById('previousCard');
        previousCardElement.innerHTML = '';
        if (this.previousCard) {
            previousCardElement.appendChild(this.createCardElement(this.previousCard));
        }
        
        // Update current card
        const currentCardElement = document.getElementById('currentCard');
        currentCardElement.innerHTML = '';
        if (this.currentCard) {
            currentCardElement.appendChild(this.createCardElement(this.currentCard));
        }
        
        // Update next card - chỉ hiện mặt sau của lá bài
        const nextCardElement = document.getElementById('nextCard');
        nextCardElement.innerHTML = '';
        if (this.nextCard) {
            const nextCardDiv = document.createElement('div');
            nextCardDiv.className = 'card hidden';
            // Thêm hiệu ứng mặt sau lá bài
            const backDesign = document.createElement('div');
            backDesign.className = 'card-back';
            backDesign.innerHTML = '<i class="fas fa-dice-d20"></i>';
            nextCardDiv.appendChild(backDesign);
            nextCardElement.appendChild(nextCardDiv);
        }
        
        // Update multipliers
        if (this.gameStatus === 'playing') {
            this.calculateMultiplier(true);
        }
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
    
    addToHistory(result, amount) {
        const historyList = document.getElementById('hiloHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${result}`;
        
        historyItem.textContent = result === 'win' ? 
            `Win ${amount.toFixed(2)}` : 
            `Lose ${amount.toFixed(2)}`;
        
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
        HiLoGame.init();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});