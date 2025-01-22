const SlotMachine = {
    reels: 3,
    rows: 3,
    symbols: ['🍎', '🍋', '🍇', '💎', '7️⃣', '🎰'],
    symbolValues: {
        '🍎': 2,
        '🍋': 3,
        '🍇': 4,
        '💎': 10,
        '7️⃣': 20,
        '🎰': 50
    },
    spinning: false,
    currentBet: 0,
    paylines: [
        // Horizontal lines
        [0, 1, 2],     // Top row
        [3, 4, 5],     // Middle row
        [6, 7, 8],     // Bottom row
        // Diagonal lines
        [0, 4, 8],     // Diagonal from top left
        [6, 4, 2],     // Diagonal from bottom left
        // V shapes
        [0, 4, 0],     // V shape top
        [8, 4, 8],     // Inverse V shape bottom
        // W shape
        [0, 6, 2]      // W shape
    ],
    
    initialize() {
        this.createReels();
        this.setupEventListeners();
        this.showPaylines();
    },
    
    createReels() {
        const slotContainer = document.querySelector('.slot-reels');
        slotContainer.innerHTML = '';
        
        for (let i = 0; i < this.reels; i++) {
            const reel = document.createElement('div');
            reel.className = 'reel';
            
            for (let j = 0; j < this.rows; j++) {
                const symbol = document.createElement('div');
                symbol.className = 'symbol';
                symbol.textContent = this.getRandomSymbol();
                reel.appendChild(symbol);
            }
            
            slotContainer.appendChild(reel);
        }
    },
    
    setupEventListeners() {
        document.getElementById('spinSlot').addEventListener('click', () => this.spin());
        
        // Bet amount controls
        document.getElementById('halfSlotBet').addEventListener('click', () => {
            const input = document.getElementById('slotBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });
        
        document.getElementById('doubleSlotBet').addEventListener('click', () => {
            const input = document.getElementById('slotBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });
        
        document.getElementById('maxSlotBet').addEventListener('click', () => {
            document.getElementById('slotBetAmount').value = balance.toFixed(2);
        });
    },
    
    getRandomSymbol() {
        return this.symbols[Math.floor(Math.random() * this.symbols.length)];
    },
    
    spin() {
        if (this.spinning) return;
        
        const betAmount = parseFloat(document.getElementById('slotBetAmount').value);
        if (betAmount > balance) {
            alert('Insufficient balance!');
            return;
        }
        
        this.currentBet = betAmount;
        updateBalance(-betAmount);
        this.spinning = true;
        
        // Disable spin button
        document.getElementById('spinSlot').disabled = true;
        
        const reels = document.querySelectorAll('.reel');
        let completedReels = 0;
        
        // Store final symbols for each reel
        const finalSymbols = Array(this.reels).fill().map(() => 
            Array(this.rows).fill().map(() => this.getRandomSymbol())
        );
        
        reels.forEach((reel, i) => {
            // Create animation
            const symbols = reel.querySelectorAll('.symbol');
            let currentPos = 0;
            const finalPos = 30 + i * 5; // Different stopping positions
            
            const spinReel = () => {
                currentPos++;
                
                symbols.forEach((symbol, j) => {
                    if (currentPos === finalPos) {
                        // Set final symbol
                        symbol.textContent = finalSymbols[i][j];
                        symbol.style.transform = 'translateY(0)';
                    } else {
                        // Random symbol during spin
                        symbol.textContent = this.getRandomSymbol();
                        symbol.style.transform = `translateY(${-currentPos * 10}%)`;
                    }
                });
                
                if (currentPos < finalPos) {
                    requestAnimationFrame(spinReel);
                } else {
                    completedReels++;
                    if (completedReels === this.reels) {
                        this.checkWin(finalSymbols);
                    }
                }
            };
            
            setTimeout(() => requestAnimationFrame(spinReel), i * 200);
        });
    },
    
    checkWin(finalSymbols) {
        let totalWin = 0;
        
        // Check rows
        for (let i = 0; i < this.rows; i++) {
            const rowSymbols = finalSymbols.map(reel => reel[i]);
            const uniqueSymbols = new Set(rowSymbols);
            
            if (uniqueSymbols.size === 1) {
                const symbol = rowSymbols[0];
                const multiplier = this.symbolValues[symbol];
                totalWin += this.currentBet * multiplier;
                
                // Highlight winning row
                this.highlightWin(i, 'row');
            }
        }
        
        setTimeout(() => {
            if (totalWin > 0) {
                updateBalance(totalWin);
                this.showWin(totalWin);
                this.addToHistory('win', totalWin);
            } else {
                this.showLose();
                this.addToHistory('lose', this.currentBet);
            }
            
            // Re-enable spin button
            document.getElementById('spinSlot').disabled = false;
            this.spinning = false;
        }, 500);
    },
    
    highlightWin(index, type) {
        const symbols = document.querySelectorAll('.symbol');
        if (type === 'row') {
            for (let i = 0; i < this.reels; i++) {
                symbols[i * this.rows + index].classList.add('win-highlight');
            }
        }
        
        setTimeout(() => {
            symbols.forEach(symbol => symbol.classList.remove('win-highlight'));
        }, 2000);
    },
    
    showWin(amount) {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-result win';
        messageElement.innerHTML = `
            <div class="result-text">YOU WIN!</div>
            <div class="result-amount">+$${amount.toFixed(2)}</div>
        `;
        
        document.querySelector('.slot-container').appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 300);
        }, 2000);
    },
    
    showLose() {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-result lose';
        messageElement.innerHTML = `
            <div class="result-text">YOU LOSE!</div>
            <div class="result-amount">-$${this.currentBet.toFixed(2)}</div>
        `;
        
        document.querySelector('.slot-container').appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 300);
        }, 2000);
    },
    
    addToHistory(result, amount) {
        const historyList = document.getElementById('slotHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${result}`;
        
        historyItem.textContent = result === 'win' ? 
            `Win ${amount.toFixed(2)}` : 
            `Lose ${amount.toFixed(2)}`;
        
        if (historyList.firstChild) {
            historyList.insertBefore(historyItem, historyList.firstChild);
        } else {
            historyList.appendChild(historyItem);
        }
        
        while (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
        
        requestAnimationFrame(() => {
            historyItem.style.opacity = '1';
            historyItem.style.transform = 'translateY(0)';
        });
    },
    
    showPaylines() {
        const paylineContainer = document.createElement('div');
        paylineContainer.className = 'payline-container';
        
        this.paylines.forEach((line, index) => {
            const paylineDiv = document.createElement('div');
            paylineDiv.className = 'payline';
            paylineDiv.innerHTML = `
                <div class="payline-grid">
                    ${this.createPaylineGrid(line)}
                </div>
                <div class="payline-multiplier">x${this.getPaylineMultiplier(index)}</div>
            `;
            paylineContainer.appendChild(paylineDiv);
        });
        
        document.querySelector('.paytable').appendChild(paylineContainer);
    },
    
    createPaylineGrid(line) {
        let grid = '';
        for(let i = 0; i < 9; i++) {
            grid += `<div class="grid-cell ${line.includes(i) ? 'active' : ''}"></div>`;
        }
        return grid;
    },
    
    getPaylineMultiplier(index) {
        const multipliers = [3, 3, 3, 4, 4, 5, 5, 6];
        return multipliers[index] || 3;
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
        SlotMachine.initialize();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});

// Cập nhật hàm placeBet
async function placeSlotBet() {
    const betAmount = document.getElementById('slotBetAmount');
    if (!betAmount || !betAmount.value) {
        console.error('Bet amount input not found or empty');
        return;
    }
    
    const amount = parseInt(betAmount.value);

    // Validation
    if (amount > balance) {
        alert('Không đủ số dư!');
        return;
    }

    if (amount < 1 || amount > 100000) {
        alert('Số tiền cược phải từ 1 đến 100000!');
        return;
    }

    // Cập nhật số dư
    const updated = await updateBalance(-amount);
    if (!updated) return;

    // Rest of the function...
}

// Cập nhật hàm addToHistory
function addToSlotHistory(result, won) {
    const historyList = document.getElementById('slotHistory');
    if (!historyList) return;
    
    const betAmount = document.getElementById('slotBetAmount');
    if (!betAmount || !betAmount.value) return;
    
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${won ? 'win' : 'lose'}`;
    historyItem.textContent = result.toFixed(2) + 'x';
    
    // Thêm vào đầu danh sách
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }
    
    // Giới hạn số lượng item trong history
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
    
    // Animation cho history item
    setTimeout(() => {
        historyItem.style.opacity = '1';
        historyItem.style.transform = 'translateY(0)';
    }, 50);
}