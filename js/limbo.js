const API_URL = 'https://stake-clone-backend.onrender.com/api';

const LimboGame = {
    chart: null,
    multiplier: 1.00,
    isRunning: false,
    currentBet: 0,
    autoCashoutMultiplier: 2.00,
    isAutoCashout: false,
    gameHistory: [],
    
    initialize() {
        const ctx = document.getElementById('limboChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0,255,127,0.2)');
        gradient.addColorStop(1, 'rgba(0,255,127,0)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Target',
                    data: [],
                    borderColor: '#00FF7F',
                    borderWidth: 3,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255,255,255,0.05)'
                        },
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return value.toFixed(2) + 'x';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        this.setupEventListeners();
    },

    setupEventListeners() {
        document.getElementById('startLimbo').addEventListener('click', () => this.start());
        
        // Auto cashout toggle
        document.getElementById('autoLimbo').addEventListener('change', (e) => {
            this.isAutoCashout = e.target.checked;
            document.getElementById('limboTarget').disabled = !e.target.checked;
        });

        // Bet amount controls
        document.getElementById('halfLimboBet').addEventListener('click', () => {
            const input = document.getElementById('limboBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });

        document.getElementById('doubleLimboBet').addEventListener('click', () => {
            const input = document.getElementById('limboBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });

        document.getElementById('maxLimboBet').addEventListener('click', () => {
            document.getElementById('limboBetAmount').value = balance.toFixed(2);
        });
    },

    start() {
        if (this.isRunning) return;

        const betAmount = parseFloat(document.getElementById('limboBetAmount').value);
        const targetMultiplier = parseFloat(document.getElementById('limboTarget').value);

        if (betAmount > balance) {
            alert('Insufficient balance!');
            return;
        }

        if (targetMultiplier < 1.01) {
            alert('Target multiplier must be at least 1.01x');
            return;
        }

        this.currentBet = betAmount;
        updateBalance(-betAmount);
        this.isRunning = true;

        // Reset chart
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.update();

        // Generate random crash point with house edge
        const houseEdge = 0.04; // 4% house edge
        const maxMultiplier = 1000;
        const randomValue = Math.random();
        const finalMultiplier = Math.min(
            1 / (randomValue + houseEdge),
            maxMultiplier
        );

        // Thêm class cho rate dựa vào kết quả
        const rateElement = document.querySelector('.limbo-rate');
        if (rateElement) {
            if (finalMultiplier < targetMultiplier) {
                rateElement.classList.add('lose');
            }
        }

        if (finalMultiplier >= targetMultiplier) {
            // Win
            const winAmount = betAmount * targetMultiplier;
            updateBalance(winAmount);
            this.addToHistory('win', targetMultiplier, winAmount);
            this.showResult('win', winAmount);
        } else {
            // Lose
            this.addToHistory('lose', finalMultiplier, 0);
            this.showResult('lose', betAmount);
        }

        // Update chart
        this.updateChart(finalMultiplier);
        
        setTimeout(() => {
            this.isRunning = false;
        }, 2000);
    },

    updateChart(finalMultiplier) {
        const points = 50;
        
        // Hiển thị rate kết quả
        const resultRate = document.createElement('div');
        resultRate.className = 'limbo-rate';
        resultRate.textContent = `${finalMultiplier.toFixed(2)}x`;
        document.querySelector('.limbo-chart-container').appendChild(resultRate);
        
        // Animation cho rate
        requestAnimationFrame(() => {
            resultRate.classList.add('show');
        });
        
        // Xóa rate sau khi hoàn thành
        setTimeout(() => {
            resultRate.classList.remove('show');
            setTimeout(() => resultRate.remove(), 300);
        }, 2000);

        // Update chart
        for (let i = 0; i <= points; i++) {
            const x = i;
            const progress = i / points;
            const y = progress * finalMultiplier;
            
            this.chart.data.labels.push(x);
            this.chart.data.datasets[0].data.push(y);
            this.chart.update();
        }
    },

    showResult(result, amount) {
        const messageElement = document.createElement('div');
        messageElement.className = `game-result ${result}`;
        
        messageElement.innerHTML = `
            <div class="result-text">${result === 'win' ? 'YOU WIN!' : 'YOU LOSE!'}</div>
            <div class="result-amount">${result === 'win' ? '+' : '-'}$${amount.toFixed(2)}</div>
        `;
        
        document.querySelector('.limbo-chart-container').appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 300);
        }, 2000);
    },

    addToHistory(result, multiplier, amount) {
        const historyList = document.getElementById('limboHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${result}`;
        
        historyItem.textContent = result === 'win' ? 
            `Win ${amount.toFixed(2)}` : 
            `Lose ${this.currentBet.toFixed(2)}`;
        
        // Thêm vào đầu danh sách
        if (historyList.firstChild) {
            historyList.insertBefore(historyItem, historyList.firstChild);
        } else {
            historyList.appendChild(historyItem);
        }
        
        // Giới hạn số lượng items
        while (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
        
        // Animation cho item mới
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
        LimboGame.initialize();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});