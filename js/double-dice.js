const DoubleDiceGame = {
    selectedBet: null,
    currentBet: 0,
    
    init() {
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // Bet amount controls
        document.getElementById('halfDoubleDiceBet').addEventListener('click', () => {
            const input = document.getElementById('doubleDiceBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });
        
        document.getElementById('doubleDoubleDiceBet').addEventListener('click', () => {
            const input = document.getElementById('doubleDiceBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });
        
        document.getElementById('maxDoubleDiceBet').addEventListener('click', () => {
            document.getElementById('doubleDiceBetAmount').value = balance.toFixed(2);
        });
        
        // Betting options
        document.querySelectorAll('.bet-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.bet-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedBet = option.dataset.type;
            });
        });
        
        // Roll button
        document.getElementById('rollDice').addEventListener('click', () => this.roll());
    },
    
    roll() {
        if (!this.selectedBet) {
            alert('Please select a bet type!');
            return;
        }
        
        const betAmount = parseFloat(document.getElementById('doubleDiceBetAmount').value);
        if (betAmount > balance) {
            alert('Insufficient balance!');
            return;
        }
        
        this.currentBet = betAmount;
        updateBalance(-betAmount);
        
        // Disable controls
        document.getElementById('rollDice').disabled = true;
        document.querySelectorAll('.bet-option').forEach(opt => opt.disabled = true);
        
        // Roll animation
        const dice1 = document.getElementById('dice1');
        const dice2 = document.getElementById('dice2');
        
        dice1.classList.add('rolling');
        dice2.classList.add('rolling');
        
        // Generate random results
        const result1 = Math.floor(Math.random() * 6) + 1;
        const result2 = Math.floor(Math.random() * 6) + 1;
        const total = result1 + result2;
        
        setTimeout(() => {
            dice1.classList.remove('rolling');
            dice2.classList.remove('rolling');
            
            // Set final rotation based on results
            dice1.style.transform = this.getDiceRotation(result1);
            dice2.style.transform = this.getDiceRotation(result2);
            
            // Check win condition
            setTimeout(() => this.checkWin(total), 500);
        }, 1000);
    },
    
    getDiceRotation(number) {
        const rotations = {
            1: 'rotateX(0deg) rotateY(0deg)',
            2: 'rotateX(-90deg) rotateY(0deg)',
            3: 'rotateX(0deg) rotateY(-90deg)',
            4: 'rotateX(0deg) rotateY(90deg)',
            5: 'rotateX(90deg) rotateY(0deg)',
            6: 'rotateX(180deg) rotateY(0deg)'
        };
        return rotations[number];
    },
    
    checkWin(total) {
        let isWin = false;
        let multiplier = 0;
        
        switch(this.selectedBet) {
            case 'under7':
                isWin = total < 7;
                multiplier = 2;
                break;
            case 'over7':
                isWin = total > 7;
                multiplier = 2;
                break;
            case 'even':
                isWin = total % 2 === 0;
                multiplier = 2;
                break;
            case 'odd':
                isWin = total % 2 !== 0;
                multiplier = 2;
                break;
            default:
                isWin = total === parseInt(this.selectedBet);
                multiplier = this.getNumberMultiplier(parseInt(this.selectedBet));
        }
        
        if (isWin) {
            const winAmount = this.currentBet * multiplier;
            updateBalance(winAmount);
            this.showResult('win', winAmount);
            this.addToHistory('win', winAmount);
        } else {
            this.showResult('lose');
            this.addToHistory('lose', this.currentBet);
        }
        
        // Reset controls
        setTimeout(() => {
            document.getElementById('rollDice').disabled = false;
            document.querySelectorAll('.bet-option').forEach(opt => opt.disabled = false);
        }, 2000);
    },
    
    getNumberMultiplier(number) {
        const multipliers = {
            2: 30, 12: 30,
            3: 15, 11: 15,
            4: 10, 10: 10,
            5: 8, 9: 8,
            6: 6, 8: 6,
            7: 5
        };
        return multipliers[number] || 2;
    },
    
    showResult(result, amount = 0) {
        const messageElement = document.createElement('div');
        messageElement.className = `game-result ${result}`;
        
        let resultText = '';
        let amountText = '';
        
        if (result === 'win') {
            resultText = 'YOU WIN!';
            amountText = `+$${amount.toFixed(2)}`;
        } else {
            resultText = 'YOU LOSE!';
            amountText = `-$${this.currentBet.toFixed(2)}`;
        }
        
        messageElement.innerHTML = `
            <div class="result-text">${resultText}</div>
            <div class="result-amount">${amountText}</div>
        `;
        
        document.querySelector('.double-dice-table').appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 300);
        }, 2000);
    },
    
    addToHistory(result, amount) {
        const historyList = document.getElementById('doubleDiceHistory');
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
        const response = await fetch('http://localhost:3000/api/balance', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        balance = data.balance;
        DoubleDiceGame.init();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});