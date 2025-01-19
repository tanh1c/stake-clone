const SlotMachine = {
    reels: 5,
    rows: 3,
    symbols: {
        regular: ['7️⃣', '💎', '🎰', '🍇', '🍋', '🍎', '🔔', '🎲'],
        wild: '⭐',    // Wild symbol thay thế được mọi symbol
        multiplierWild: '💫', // Wild với множитель
        expandingWild: '��', // Wild mở rộng
        stickyWild: '✨',    // Wild dính
        scatter: '🎁'  // Scatter symbol kích hoạt free spins
    },
    jackpot: {
        mini: 1000,
        major: 5000,
        mega: 10000,
        current: {
            mini: 1000,
            major: 5000,
            mega: 10000
        }
    },
    stickyWildPositions: [],
    bonusGameActive: false,
    bonusGameType: null,
    paylines: [
        [0,1,2,3,4],   // Hàng trên
        [5,6,7,8,9],   // Hàng giữa
        [10,11,12,13,14], // Hàng dưới
        [0,6,12,8,4],  // Chéo từ trái trên xuống phải dưới
        [10,6,2,8,14], // Chéo từ trái dưới lên phải trên
        [0,6,2,8,4],   // Zigzag 1
        [10,6,12,8,14],// Zigzag 2
        [5,1,7,3,9],   // Zigzag 3
        [0,5,10,5,0],  // V shape
        [4,9,14,9,4],  // Inverse V shape
        [0,5,10,15,20],// Diagonal full
        [4,9,14,19,24] // Diagonal full inverse
    ],
    payTable: {
        '🎰🎰🎰🎰🎰': 100,
        '🎰🎰🎰🎰': 50,
        '🎰🎰🎰': 20,
        '7️⃣7️⃣7️⃣7️⃣7️⃣': 80,
        '7️⃣7️⃣7️⃣7️⃣': 40,
        '7️⃣7️⃣7️⃣': 15,
        '💎💎💎💎💎': 60,
        '💎💎💎💎': 30,
        '💎💎💎': 10,
        '⭐⭐⭐⭐⭐': 500, // Wild symbols
        '⭐⭐⭐⭐': 200,
        '⭐⭐⭐': 50,
        '🎁🎁🎁🎁🎁': 200, // Scatter symbols
        '🎁🎁🎁🎁': 100,
        '🎁🎁🎁🎁': 50
    },
    freeSpins: 0,
    isAutoSpin: false,
    autoSpinCount: 0,
    maxAutoSpins: 100,
    spinning: false,
    currentBet: 0,
    
    initialize() {
        this.createReels();
        this.setupEventListeners();
        this.createPaylineDisplay();
        this.updateFreeSpinsDisplay();
        this.updateJackpotDisplay();
        this.startJackpotIncrement();
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
    
    createPaylineDisplay() {
        const container = document.querySelector('.paylines-display');
        this.paylines.forEach((payline, index) => {
            const line = document.createElement('div');
            line.className = 'payline-preview';
            line.innerHTML = `Line ${index + 1}`;
            container.appendChild(line);
        });
    },
    
    updateFreeSpinsDisplay() {
        const display = document.querySelector('.free-spins-display');
        if (this.freeSpins > 0) {
            display.textContent = `Free Spins: ${this.freeSpins}`;
            display.style.display = 'block';
        } else {
            display.style.display = 'none';
        }
    },
    
    getRandomSymbol() {
        const rand = Math.random();
        if (rand < 0.01) return this.symbols.wild;
        if (rand < 0.015) return this.symbols.multiplierWild;
        if (rand < 0.02) return this.symbols.expandingWild;
        if (rand < 0.025) return this.symbols.stickyWild;
        if (rand < 0.05) return this.symbols.scatter;
        return this.symbols.regular[Math.floor(Math.random() * this.symbols.regular.length)];
    },
    
    spin() {
        if (this.spinning) return;
        
        // Check if this is a free spin
        const isFreeSpinActive = this.freeSpins > 0;
        if (!isFreeSpinActive) {
            const betAmount = parseFloat(document.getElementById('slotBetAmount').value);
            if (betAmount > balance) {
                alert('Insufficient balance!');
                return;
            }
            this.currentBet = betAmount;
            updateBalance(-betAmount);
        } else {
            this.freeSpins--;
            this.updateFreeSpinsDisplay();
        }
        
        this.spinning = true;
        
        // Disable spin button
        document.getElementById('spinSlot').disabled = true;
        
        const reels = document.querySelectorAll('.reel');
        let completedReels = 0;
        
        // Spin từng reel với thời gian khác nhau
        reels.forEach((reel, i) => {
            const symbols = reel.querySelectorAll('.symbol');
            const duration = 2000 + (i * 500); // Reel sau quay lâu hơn reel trước
            
            this.spinReel(reel, symbols, duration).then(() => {
                completedReels++;
                if (completedReels === this.reels) {
                    this.checkWin(this.currentBet);
                }
            });
        });
    },
    
    spinReel(reel, symbols, duration) {
        return new Promise(resolve => {
            let rotations = 0;
            const totalRotations = 20 + Math.floor(Math.random() * 10);
            const interval = 50;
            
            const spin = () => {
                symbols.forEach(symbol => {
                    symbol.textContent = this.getRandomSymbol();
                });
                
                rotations++;
                if (rotations < totalRotations) {
                    setTimeout(spin, interval);
                } else {
                    this.spinning = false;
                    resolve();
                }
            };
            
            spin();
        });
    },
    
    checkWin(betAmount) {
        const symbols = document.querySelectorAll('.symbol');
        let totalWin = 0;
        let scatterCount = 0;
        let bonusSymbolCount = 0;
        
        // Handle special wilds first
        const symbolsArray = Array.from(symbols).map(s => s.textContent);
        const processedSymbols = this.handleSpecialWilds(symbolsArray);
        
        this.paylines.forEach(payline => {
            const lineSymbols = payline.map(i => processedSymbols[i]);
            lineSymbols.forEach(symbol => {
                if (symbol === this.symbols.scatter) scatterCount++;
                if (symbol === this.symbols.bonus) bonusSymbolCount++;
            });
            const win = this.calculateWin(lineSymbols, betAmount);
            if (win > 0) {
                totalWin += win;
                this.highlightWinningLine(payline);
            }
        });
        
        // Check for bonus game trigger
        if (bonusSymbolCount >= 3) {
            this.startBonusGame();
        }
        
        // Handle scatter wins and free spins
        if (scatterCount >= 3) {
            const scatterWin = betAmount * this.payTable[this.symbols.scatter.repeat(scatterCount)];
            totalWin += scatterWin;
            this.awardFreeSpins(scatterCount);
        }
        
        if (totalWin > 0) {
            updateBalance(totalWin);
            this.showWin(totalWin);
            this.addToHistory('win', totalWin);
        } else {
            this.showLose();
            this.addToHistory('lose', betAmount);
        }
        
        // Re-enable spin button
        document.getElementById('spinSlot').disabled = false;
        this.spinning = false;
    },
    
    calculateWin(symbols, bet) {
        // Kiểm tra các combination từ cao xuống thấp
        for (const [pattern, multiplier] of Object.entries(this.payTable)) {
            const patternSymbols = pattern.match(/./gu);
            const matches = symbols.join('').startsWith(patternSymbols.join(''));
            if (matches) {
                return bet * multiplier;
            }
        }
        return 0;
    },
    
    highlightWinningLine(payline) {
        const symbols = document.querySelectorAll('.symbol');
        payline.forEach(i => {
            symbols[i].classList.add('winning');
        });
        
        setTimeout(() => {
            payline.forEach(i => {
                symbols[i].classList.remove('winning');
            });
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
    
    awardFreeSpins(scatterCount) {
        let spinsAwarded = 0;
        switch(scatterCount) {
            case 3: spinsAwarded = 10; break;
            case 4: spinsAwarded = 15; break;
            case 5: spinsAwarded = 20; break;
        }
        
        this.freeSpins += spinsAwarded;
        this.updateFreeSpinsDisplay();
        this.showFreeSpinsWon(spinsAwarded);
    },
    
    showFreeSpinsWon(spinsCount) {
        const messageElement = document.createElement('div');
        messageElement.className = 'free-spins-won';
        messageElement.innerHTML = `
            <div class="result-text">FREE SPINS WON!</div>
            <div class="spins-count">+${spinsCount} Free Spins</div>
        `;
        
        document.querySelector('.slot-container').appendChild(messageElement);
        
        setTimeout(() => messageElement.remove(), 3000);
    },
    
    handleSpecialWilds(symbols) {
        // Handle Expanding Wilds
        symbols.forEach((symbol, index) => {
            if (symbol === this.symbols.expandingWild) {
                const column = index % this.reels;
                for (let row = 0; row < this.rows; row++) {
                    const expandPosition = column + (row * this.reels);
                    symbols[expandPosition] = this.symbols.wild;
                }
            }
        });

        // Handle Sticky Wilds
        symbols.forEach((symbol, index) => {
            if (symbol === this.symbols.stickyWild) {
                this.stickyWildPositions.push(index);
            }
        });

        return symbols;
    },
    
    startBonusGame() {
        this.bonusGameActive = true;
        const bonusTypes = ['pickAndClick', 'wheelOfFortune', 'miniSlots'];
        this.bonusGameType = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];

        switch(this.bonusGameType) {
            case 'pickAndClick':
                this.startPickAndClickBonus();
                break;
            case 'wheelOfFortune':
                this.startWheelOfFortuneBonus();
                break;
            case 'miniSlots':
                this.startMiniSlotsBonus();
                break;
        }
    },
    
    startPickAndClickBonus() {
        const bonusContainer = document.createElement('div');
        bonusContainer.className = 'bonus-game pick-click';
        bonusContainer.innerHTML = `
            <h2>Pick and Click Bonus</h2>
            <div class="bonus-items"></div>
        `;

        const items = bonusContainer.querySelector('.bonus-items');
        for (let i = 0; i < 12; i++) {
            const item = document.createElement('div');
            item.className = 'bonus-item';
            item.innerHTML = '?';
            item.onclick = () => this.handlePickAndClick(item);
            items.appendChild(item);
        }

        document.querySelector('.slot-container').appendChild(bonusContainer);
    },
    
    handlePickAndClick(item) {
        const prizes = ['2x', '3x', '5x', '10x', 'MINI', 'MAJOR'];
        const prize = prizes[Math.floor(Math.random() * prizes.length)];
        item.innerHTML = prize;
        item.classList.add('revealed');

        if (prize.includes('x')) {
            const multiplier = parseInt(prize);
            const win = this.currentBet * multiplier;
            this.showWin(win);
            updateBalance(win);
        } else {
            // Jackpot win
            const jackpotAmount = this.jackpot.current[prize.toLowerCase()];
            this.showJackpotWin(prize, jackpotAmount);
            updateBalance(jackpotAmount);
            this.resetJackpot(prize.toLowerCase());
        }
    },
    
    showJackpotWin(type, amount) {
        const messageElement = document.createElement('div');
        messageElement.className = 'jackpot-win';
        messageElement.innerHTML = `
            <div class="jackpot-win-text">${type} JACKPOT!</div>
            <div class="jackpot-amount">$${amount.toFixed(2)}</div>
        `;
        document.querySelector('.slot-container').appendChild(messageElement);
        setTimeout(() => messageElement.remove(), 5000);
    },
    
    resetJackpot(type) {
        this.jackpot.current[type] = this.jackpot[type];
        this.updateJackpotDisplay();
    },
    
    updateJackpotDisplay() {
        ['mini', 'major', 'mega'].forEach(type => {
            const display = document.querySelector(`.jackpot-${type}`);
            if (display) {
                display.textContent = `$${this.jackpot.current[type].toFixed(2)}`;
            }
        });
    },
    
    startJackpotIncrement() {
        setInterval(() => {
            // Tăng jackpot theo thời gian thực
            this.jackpot.current.mini += 0.01;
            this.jackpot.current.major += 0.05;
            this.jackpot.current.mega += 0.1;
            this.updateJackpotDisplay();
        }, 1000);
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