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
    currentBet: 0,
    multiplier: 1,
    pipesPassed: 0,
    
    init() {
        this.canvas = document.getElementById('flappyCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Setup controls
        document.getElementById('betAmount').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (value > balance) {
                e.target.value = balance;
            }
        });

        document.getElementById('startFlappyGame').addEventListener('click', () => {
            if (this.isPlaying) return;
            
            const betAmount = parseFloat(document.getElementById('betAmount').value);
            if (isNaN(betAmount) || betAmount <= 0) {
                alert('Vui lòng nhập số tiền cược hợp lệ');
                return;
            }
            
            if (betAmount > balance) {
                alert('Số dư không đủ');
                return;
            }
            
            this.startGame(betAmount);
        });

        // Jump control
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
    },
    
    startGame(betAmount) {
        this.currentBet = betAmount;
        balance -= betAmount;
        document.querySelector('.balance').textContent = `Balance: $${balance.toFixed(2)}`;
        
        this.isPlaying = true;
        this.multiplier = 1;
        this.pipesPassed = 0;
        this.bird.y = 150;
        this.bird.velocity = 0;
        this.pipes = [];
        
        // Add initial pipes
        this.addPipe();
        
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 1000/60);
        
        // Update UI
        document.getElementById('currentMultiplier').textContent = `Multiplier: ${this.multiplier.toFixed(2)}x`;
    },
    
    update() {
        // Bird physics
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Add new pipes
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 300) {
            this.addPipe();
        }
        
        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= 2;
            
            // Check if pipe is passed
            if (!this.pipes[i].passed && this.pipes[i].x + 50 < this.bird.x) {
                this.pipes[i].passed = true;
                this.pipesPassed++;
                this.multiplier *= 1.2; // Increase multiplier by 20% for each pipe
                document.getElementById('currentMultiplier').textContent = 
                    `Multiplier: ${this.multiplier.toFixed(2)}x`;
            }
            
            // Remove off-screen pipes
            if (this.pipes[i].x + 50 < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Check collisions
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        // Draw everything
        this.draw();
    },
    
    addPipe() {
        const gap = 120;
        const minHeight = 50;
        const maxHeight = this.canvas.height - gap - minHeight;
        const height = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: height,
            passed: false
        });
    },
    
    checkCollision() {
        // Ground/ceiling collision
        if (this.bird.y < 0 || this.bird.y + this.bird.size > this.canvas.height) {
            return true;
        }
        
        // Pipe collision
        for (const pipe of this.pipes) {
            if (this.bird.x + this.bird.size > pipe.x && 
                this.bird.x < pipe.x + 50 &&
                (this.bird.y < pipe.topHeight || 
                 this.bird.y + this.bird.size > pipe.topHeight + 120)) {
                return true;
            }
        }
        
        return false;
    },
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1A242D';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bird
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.size, this.bird.size);
        
        // Draw pipes
        this.ctx.fillStyle = '#4CAF50';
        for (const pipe of this.pipes) {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, 50, pipe.topHeight);
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.topHeight + 120, 50, this.canvas.height);
        }
    },
    
    async gameOver() {
        this.isPlaying = false;
        clearInterval(this.gameLoop);
        
        const finalMultiplier = this.multiplier;
        const winAmount = this.currentBet * finalMultiplier;
        
        // Update balance
        balance += winAmount;
        document.querySelector('.balance').textContent = `Balance: $${balance.toFixed(2)}`;
        
        // Save game history
        const gameData = {
            game: 'flappy',
            bet: this.currentBet,
            multiplier: finalMultiplier,
            pipesPassed: this.pipesPassed,
            profit: winAmount - this.currentBet
        };
        
        try {
            await saveGameHistory(gameData);
            updateHistory(gameData);
        } catch (error) {
            console.error('Error saving game history:', error);
        }
    }
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'auth.html';
            return;
        }
        
        const response = await fetch(`${API_URL}/getBalance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        balance = data.balance;
        FlappyGame.init();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
}); 