const RouletteGame = {
    isSpinning: false,
    currentBets: {},
    numbers: [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
        5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ],
    
    initialize() {
        this.setupBettingBoard();
        this.setupControls();
        
        // Gán hàm cho window để gọi từ HTML
        window.spinRoulette = () => this.spin();
        window.clearRouletteBets = () => this.clearBets();
    },
    
    setupBettingBoard() {
        const board = document.getElementById('bettingBoard');
        
        // Tạo số từ 0-36
        for (let i = 0; i <= 36; i++) {
            const number = document.createElement('div');
            number.className = `betting-number ${this.getNumberColor(i)}`;
            number.textContent = i;
            number.onclick = () => this.placeBet('number', i);
            board.appendChild(number);
        }
        
        // Thêm các lựa chọn cược khác
        const specialBets = [
            { type: 'red', label: 'RED', odds: 2 },
            { type: 'black', label: 'BLACK', odds: 2 },
            { type: 'even', label: 'EVEN', odds: 2 },
            { type: 'odd', label: 'ODD', odds: 2 },
            { type: '1-18', label: '1-18', odds: 2 },
            { type: '19-36', label: '19-36', odds: 2 },
            { type: '1st12', label: '1st 12', odds: 3 },
            { type: '2nd12', label: '2nd 12', odds: 3 },
            { type: '3rd12', label: '3rd 12', odds: 3 }
        ];
        
        specialBets.forEach(bet => {
            const betButton = document.createElement('div');
            betButton.className = `betting-special ${bet.type}`;
            betButton.textContent = bet.label;
            betButton.onclick = () => this.placeBet(bet.type);
            board.appendChild(betButton);
        });
    },
    
    setupControls() {
        // Bet amount controls
        document.getElementById('halfRouletteBet').onclick = () => {
            const input = document.getElementById('rouletteBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        };
        
        document.getElementById('doubleRouletteBet').onclick = () => {
            const input = document.getElementById('rouletteBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        };
        
        document.getElementById('maxRouletteBet').onclick = () => {
            document.getElementById('rouletteBetAmount').value = balance.toFixed(2);
        };
    },
    
    placeBet(type, value = null) {
        if (this.isSpinning) return;
        
        const betAmount = parseFloat(document.getElementById('rouletteBetAmount').value);
        if (betAmount > balance) {
            alert('Không đủ số dư!');
            return;
        }
        
        const betKey = value !== null ? `${type}_${value}` : type;
        this.currentBets[betKey] = (this.currentBets[betKey] || 0) + betAmount;
        updateBalance(-betAmount);
        
        this.updateBetsDisplay();
    },
    
    updateBetsDisplay() {
        const display = document.getElementById('currentBets');
        display.innerHTML = '';
        
        Object.entries(this.currentBets).forEach(([bet, amount]) => {
            const betDisplay = document.createElement('div');
            betDisplay.className = 'current-bet';
            betDisplay.textContent = `${bet}: $${amount.toFixed(2)}`;
            display.appendChild(betDisplay);
        });
    },
    
    clearBets() {
        Object.entries(this.currentBets).forEach(([bet, amount]) => {
            updateBalance(amount);
        });
        this.currentBets = {};
        this.updateBetsDisplay();
    },
    
    spin() {
        if (this.isSpinning || Object.keys(this.currentBets).length === 0) return;
        
        this.isSpinning = true;
        document.getElementById('spinRoulette').disabled = true;
        
        // Hiệu ứng loading
        const resultDisplay = document.querySelector('.result-number');
        resultDisplay.textContent = '?';
        resultDisplay.className = 'result-number loading';
        
        // Random số thắng sau 1 giây
        setTimeout(() => {
            const winningNumber = Math.floor(Math.random() * 37); // 0-36
            
            // Hiển thị kết quả
            resultDisplay.classList.remove('loading');
            resultDisplay.textContent = winningNumber;
            resultDisplay.classList.add(this.getNumberColor(winningNumber), 'show');
            
            this.evaluateWin(winningNumber);
            this.isSpinning = false;
            document.getElementById('spinRoulette').disabled = false;
            this.currentBets = {};
            this.updateBetsDisplay();
        }, 1000);
    },
    
    evaluateWin(number) {
        let totalWin = 0;
        
        Object.entries(this.currentBets).forEach(([bet, amount]) => {
            const [type, value] = bet.split('_');
            let win = 0;
            
            switch(type) {
                case 'number':
                    if (parseInt(value) === number) win = amount * 36;
                    break;
                case 'red':
                    if (this.getNumberColor(number) === 'red') win = amount * 2;
                    break;
                case 'black':
                    if (this.getNumberColor(number) === 'black') win = amount * 2;
                    break;
                case 'even':
                    if (number !== 0 && number % 2 === 0) win = amount * 2;
                    break;
                case 'odd':
                    if (number !== 0 && number % 2 === 1) win = amount * 2;
                    break;
                case '1-18':
                    if (number >= 1 && number <= 18) win = amount * 2;
                    break;
                case '19-36':
                    if (number >= 19 && number <= 36) win = amount * 2;
                    break;
                case '1st12':
                    if (number >= 1 && number <= 12) win = amount * 3;
                    break;
                case '2nd12':
                    if (number >= 13 && number <= 24) win = amount * 3;
                    break;
                case '3rd12':
                    if (number >= 25 && number <= 36) win = amount * 3;
                    break;
            }
            
            if (win > 0) {
                totalWin += win;
                this.showWinAnimation(bet, win);
            }
        });
        
        if (totalWin > 0) {
            updateBalance(totalWin);
            this.showWinNotification(totalWin);
        }
    },
    
    getNumberColor(number) {
        if (number === 0) return 'green';
        const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        return redNumbers.includes(number) ? 'red' : 'black';
    },
    
    showWinAnimation(bet, amount) {
        const betEl = document.querySelector(`[data-bet="${bet}"]`);
        if (betEl) {
            betEl.classList.add('win-animation');
            setTimeout(() => betEl.classList.remove('win-animation'), 2000);
        }
    },
    
    showWinNotification(amount) {
        const notification = document.createElement('div');
        notification.className = 'win-notification';
        notification.textContent = `Win: $${amount.toFixed(2)}`;
        document.querySelector('.roulette-game').appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
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
        const response = await fetch(`${CrashGame.API_URL}/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        balance = data.balance;
        RouletteGame.initialize();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});