// Đặt tất cả biến và hàm trong một namespace
const CrashGame = {
    multiplier: 1.00,
    isCrashing: false,
    interval: null,
    currentBet: 0,
    autoCashoutMultiplier: 2.00,
    isAutoCashout: false,
    gameHistory: [],
    chart: null,

    initialize() {
        const ctx = document.getElementById('crashChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0,255,127,0.2)');
        gradient.addColorStop(1, 'rgba(0,255,127,0)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Multiplier',
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
                            color: 'rgba(255,255,255,0.05)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#888',
                            font: {
                                size: 12
                            },
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
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        // Thêm glow line
        const glowLine = document.createElement('div');
        glowLine.className = 'glow-line';
        document.querySelector('.crash-chart-container').appendChild(glowLine);

        // Thêm event listeners
        document.getElementById('autoCashout').addEventListener('change', (e) => {
            document.getElementById('autoCashoutAt').disabled = !e.target.checked;
        });

        document.getElementById('halfCrashBet').addEventListener('click', () => {
            const input = document.getElementById('crashBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });

        document.getElementById('doubleCrashBet').addEventListener('click', () => {
            const input = document.getElementById('crashBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });

        document.getElementById('maxCrashBet').addEventListener('click', () => {
            document.getElementById('crashBetAmount').value = balance.toFixed(2);
        });

        // Thêm ripple effect cho các nút
        ['startCrash', 'cashoutCrash'].forEach(btnId => {
            document.getElementById(btnId).addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = e.clientX - rect.left - size/2 + 'px';
                ripple.style.top = e.clientY - rect.top - size/2 + 'px';
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Gán các hàm cho window để có thể gọi từ onclick
        window.startCrashGame = () => this.start();
        window.cashoutCrash = () => this.cashout();
    },

    start() {
        if (this.isCrashing) return;

        const betAmount = parseFloat(document.getElementById('crashBetAmount').value);
        this.autoCashoutMultiplier = parseFloat(document.getElementById('autoCashoutAt').value);
        this.isAutoCashout = document.getElementById('autoCashout').checked;

        if (betAmount > balance) {
            alert('Không đủ số dư!');
            return;
        }

        // Reset game state
        this.currentBet = betAmount;
        updateBalance(-betAmount);
        this.multiplier = 1.00;
        this.isCrashing = true;

        // Reset chart colors về màu xanh lá
        this.chart.data.datasets[0].borderColor = '#00FF7F';
        const gradient = this.chart.ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0,255,127,0.2)');
        gradient.addColorStop(1, 'rgba(0,255,127,0)');
        this.chart.data.datasets[0].backgroundColor = gradient;
        this.chart.update();

        // Reset chart
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];

        // Update UI
        document.getElementById('startCrash').disabled = true;
        document.getElementById('cashoutCrash').disabled = false;
        document.getElementById('currentMultiplier').textContent = '1.00x';

        // Thêm animation cho multiplier
        const multiplierEl = document.getElementById('currentMultiplier');
        multiplierEl.classList.remove('crashing');
        
        // Start crash animation
        let timeElapsed = 0;
        this.interval = setInterval(() => {
            timeElapsed += 0.1;
            
            // Tính toán multiplier với easing
            this.multiplier = Math.pow(Math.E, 0.06 * timeElapsed);
            this.multiplier = parseFloat(this.multiplier.toFixed(2));
            
            // Cập nhật chart với animation mượt
            this.chart.data.labels.push(timeElapsed);
            this.chart.data.datasets[0].data.push(this.multiplier);
            
            // Di chuyển view để luôn thấy điểm mới nhất
            if (this.chart.data.labels.length > 50) {
                this.chart.data.labels.shift();
                this.chart.data.datasets[0].data.shift();
            }
            
            // Cập nhật glow line
            const progress = (this.multiplier - 1) / (10 - 1);
            document.querySelector('.glow-line').style.width = `${progress * 100}%`;
            
            this.chart.update('none'); // Tắt animation để mượt hơn
            
            // Cập nhật multiplier với hiệu ứng
            multiplierEl.textContent = this.multiplier.toFixed(2) + 'x';
            multiplierEl.style.transform = `translate(-50%, -50%) scale(${1 + (this.multiplier - 1) * 0.05})`;
            
            // Kiểm tra auto cashout
            if (this.isAutoCashout && this.multiplier >= this.autoCashoutMultiplier) {
                this.cashout();
            }

            // Random crash point
            if (Math.random() < 0.01) {
                this.end();
            }
        }, 50); // Giảm interval để animation mượt hơn

        // Thêm animation cho nút cashout
        const cashoutBtn = document.getElementById('cashoutCrash');
        cashoutBtn.style.animation = 'none';
        void cashoutBtn.offsetWidth; // Trigger reflow
        cashoutBtn.style.animation = 'cashoutPulse 1s infinite';
    },

    cashout() {
        if (!this.isCrashing) return;

        const winAmount = this.currentBet * this.multiplier;
        updateBalance(winAmount);

        this.addToHistory(this.multiplier, true);
        this.end(true);
    },

    end(cashed = false) {
        this.isCrashing = false;
        clearInterval(this.interval);

        // Update UI
        document.getElementById('startCrash').disabled = false;
        document.getElementById('cashoutCrash').disabled = true;

        if (!cashed) {
            this.addToHistory(this.multiplier, false);
            const multiplierEl = document.getElementById('currentMultiplier');
            multiplierEl.classList.add('crashing');
            
            // Crash animation với màu đỏ
            this.chart.data.datasets[0].borderColor = '#FF4444';
            const gradient = this.chart.ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(255,68,68,0.2)');
            gradient.addColorStop(1, 'rgba(255,68,68,0)');
            this.chart.data.datasets[0].backgroundColor = gradient;
            this.chart.update();
            
            // Shake animation
            document.querySelector('.crash-chart-container').style.animation = 'shake 0.5s ease';
            
            // Reset animation sau khi shake
            setTimeout(() => {
                document.querySelector('.crash-chart-container').style.animation = 'none';
            }, 500);
        }

        // Dừng animation của nút cashout
        document.getElementById('cashoutCrash').style.animation = 'none';
    },

    addToHistory(multiplier, cashed) {
        const historyList = document.getElementById('crashHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${cashed ? 'history-win' : 'history-lose'}`;
        historyItem.textContent = multiplier.toFixed(2) + 'x';

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
        CrashGame.initialize();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});