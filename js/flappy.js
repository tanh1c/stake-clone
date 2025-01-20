const FlappyGame = {
    canvas: null,
    ctx: null,
    bird: {
        x: 50,
        y: 150,
        velocity: 0,
        gravity: 0.5,
        jump: -8,
        size: 20
    },
    pipes: [],
    gameLoop: null,
    isPlaying: false,
    score: 0,
    multiplier: 1,
    currentBet: 0,
    
    init() {
        this.canvas = document.getElementById('flappyCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Event listeners
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isPlaying) {
                this.bird.velocity = this.bird.jump;
            }
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.isPlaying) {
                this.bird.velocity = this.bird.jump;
            }
        });
        
        // Setup controls
        document.getElementById('startFlappy').addEventListener('click', () => this.startGame());
        
        this.drawInitialState();
    },
    
    startGame() {
        const betAmount = parseFloat(document.getElementById('flappyBetAmount').value);
        
        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Vui lòng nhập số tiền cược hợp lệ');
            return;
        }
        
        if (betAmount > balance) {
            alert('Số dư không đủ');
            return;
        }
        
        this.currentBet = betAmount;
        this.isPlaying = true;
        this.score = 0;
        this.multiplier = 1;
        this.bird.y = 150;
        this.bird.velocity = 0;
        this.pipes = [];
        
        // Add first pipe
        this.addPipe();
        
        // Start game loop
        this.gameLoop = setInterval(() => this.update(), 1000/60);
        
        // Disable start button
        document.getElementById('startFlappy').disabled = true;
    },
    
    update() {
        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Check collisions
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        // Update pipes
        this.pipes.forEach(pipe => {
            pipe.x -= 2;
            
            // Check if passed pipe
            if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.multiplier += 0.2;
                // Play sound
                new Audio('sounds/point.mp3').play();
            }
        });
        
        // Remove off-screen pipes
        this.pipes = this.pipes.filter(pipe => pipe.x + pipe.width > 0);
        
        // Add new pipes
        if (this.pipes[this.pipes.length - 1].x < this.canvas.width - 300) {
            this.addPipe();
        }
        
        this.draw();
    },
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#70c5ce';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bird
        this.ctx.fillStyle = '#f7d51d';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw pipes
        this.pipes.forEach(pipe => {
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
            this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, this.canvas.height - pipe.bottomY);
        });
        
        // Draw score and multiplier
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Multiplier: ${this.multiplier.toFixed(1)}x`, 10, 60);
        this.ctx.fillText(`Potential Win: $${(this.currentBet * this.multiplier).toFixed(2)}`, 10, 90);
    },
    
    addPipe() {
        const gap = 120;
        const minHeight = 50;
        const maxHeight = this.canvas.height - gap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            width: 50,
            topHeight: topHeight,
            bottomY: topHeight + gap,
            passed: false
        });
    },
    
    checkCollision() {
        // Check floor/ceiling
        if (this.bird.y - this.bird.size < 0 || this.bird.y + this.bird.size > this.canvas.height) {
            return true;
        }
        
        // Check pipes
        return this.pipes.some(pipe => {
            return (this.bird.x + this.bird.size > pipe.x &&
                    this.bird.x - this.bird.size < pipe.x + pipe.width) &&
                   (this.bird.y - this.bird.size < pipe.topHeight ||
                    this.bird.y + this.bird.size > pipe.bottomY);
        });
    },
    
    async gameOver() {
        this.isPlaying = false;
        clearInterval(this.gameLoop);
        
        // Play sound
        new Audio('sounds/hit.mp3').play();
        
        // Calculate winnings
        const winAmount = this.currentBet * this.multiplier;
        
        // Update balance
        try {
            const response = await fetch(`${API_URL}/updateBalance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: winAmount - this.currentBet
                })
            });
            
            const data = await response.json();
            if (data.balance) {
                balance = data.balance;
                document.querySelector('.balance').textContent = `Balance: $${balance.toFixed(2)}`;
            }
            
            // Add to history
            this.addToHistory(this.score, winAmount > this.currentBet);
            
        } catch (error) {
            console.error('Error updating balance:', error);
        }
        
        // Enable start button
        document.getElementById('startFlappy').disabled = false;
    },
    
    addToHistory(score, won) {
        const historyList = document.getElementById('flappyHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${won ? 'win' : 'lose'}`;
        
        const amount = won ? (this.currentBet * this.multiplier - this.currentBet) : -this.currentBet;
        
        historyItem.innerHTML = `
            <div class="history-details">
                <span class="history-score">Score: ${score}</span>
                <span class="history-amount ${won ? 'win' : 'lose'}">
                    ${won ? '+' : '-'}$${Math.abs(amount).toFixed(2)}
                </span>
            </div>
            <div class="history-info">
                <span>Bet: $${this.currentBet.toFixed(2)}</span>
                <span>Multi: ${this.multiplier.toFixed(1)}x</span>
            </div>
        `;
        
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
    
    drawInitialState() {
        this.ctx.fillStyle = '#70c5ce';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Click "Start" to play', this.canvas.width/2, this.canvas.height/2);
        this.ctx.fillText('Use SPACE or CLICK to jump', this.canvas.width/2, this.canvas.height/2 + 40);
    }
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    
    FlappyGame.init();
}); 