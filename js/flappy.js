const FlappyGame = {
    canvas: null,
    ctx: null,
    bird: {
        x: 50,
        y: 150,
        velocity: 0,
        gravity: 0.5,
        jump: -8,
        size: 18
    },
    pipes: [],
    gameLoop: null,
    isPlaying: false,
    currentBet: 0,
    currentMultiplier: 1,
    pipesPassed: 0,
    
    init() {
        this.canvas = document.getElementById('flappyCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial pipes
        this.addPipe();
        
        // Start animation loop
        this.animate();
    },
    
    setupEventListeners() {
        // Jump controls
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
        
        // Bet controls
        document.getElementById('halfFlappyBet').addEventListener('click', () => {
            const input = document.getElementById('flappyBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });
        
        document.getElementById('doubleFlappyBet').addEventListener('click', () => {
            const input = document.getElementById('flappyBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });
        
        document.getElementById('maxFlappyBet').addEventListener('click', () => {
            document.getElementById('flappyBetAmount').value = balance.toFixed(2);
        });
        
        // Start button
        document.getElementById('startFlappy').addEventListener('click', () => this.startGame());
    },
    
    startGame() {
        const betAmount = parseFloat(document.getElementById('flappyBetAmount').value);
        
        if (isNaN(betAmount) || betAmount <= 0) {
            alert('Please enter a valid bet amount');
            return;
        }
        
        if (betAmount > balance) {
            alert('Insufficient balance');
            return;
        }
        
        // Reset game state
        this.bird.y = 150;
        this.bird.velocity = 0;
        this.pipes = [];
        this.addPipe();
        this.currentBet = betAmount;
        this.currentMultiplier = 1;
        this.pipesPassed = 0;
        this.isPlaying = true;
        
        // Update UI
        document.getElementById('currentMultiplier').textContent = 'Multiplier: 1.00x';
        document.getElementById('startFlappy').disabled = true;
        
        // Reset button state
        document.getElementById('startFlappy').disabled = false;
    },
    
    addPipe() {
        const gap = 120;
        const minHeight = 50;
        const maxHeight = this.canvas.height - gap - minHeight;
        const height = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: height,
            bottomY: height + gap,
            width: 50,
            passed: false
        });
    },
    
    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.isPlaying) {
            // Update bird position
            this.bird.velocity += this.bird.gravity;
            this.bird.y += this.bird.velocity;
            
            // Draw bird
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(this.bird.x, this.bird.y, this.bird.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Update and draw pipes
            for (let i = this.pipes.length - 1; i >= 0; i--) {
                const pipe = this.pipes[i];
                pipe.x -= 2; // Tốc độ di chuyển của ống
                
                // Draw pipes
                this.ctx.fillStyle = '#00FF7F';
                // Top pipe
                this.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
                // Bottom pipe
                this.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, this.canvas.height - pipe.bottomY);
                
                // Check if pipe is passed
                if (!pipe.passed && this.bird.x > pipe.x + pipe.width) {
                    pipe.passed = true;
                    this.pipesPassed++;
                    // Tăng multiplier theo cấp số nhân
                    this.currentMultiplier = 1 + (this.pipesPassed * 0.5);
                    document.getElementById('currentMultiplier').textContent = 
                        `Multiplier: ${this.currentMultiplier.toFixed(2)}x`;
                }
                
                // Check collision
                if (this.checkCollision(pipe)) {
                    this.gameOver();
                    return;
                }
                
                // Remove pipe if it's off screen
                if (pipe.x + pipe.width < 0) {
                    this.pipes.splice(i, 1);
                }
            }
            
            // Add new pipe when needed
            if (this.pipes.length === 0 || 
                this.pipes[this.pipes.length - 1].x < this.canvas.width - 300) {
                this.addPipe();
            }
            
            // Check boundaries
            if (this.bird.y < 0 || this.bird.y > this.canvas.height) {
                this.gameOver();
                return;
            }
        }
        
        requestAnimationFrame(() => this.animate());
    },
    
    checkCollision(pipe) {
        return (
            this.bird.x + this.bird.size > pipe.x &&
            this.bird.x - this.bird.size < pipe.x + pipe.width &&
            (this.bird.y - this.bird.size < pipe.topHeight ||
             this.bird.y + this.bird.size > pipe.bottomY)
        );
    },
    
    async gameOver() {
        this.isPlaying = false;
        
        const winAmount = this.currentBet * this.currentMultiplier;
        
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
                this.addToHistory(this.currentMultiplier, winAmount > this.currentBet);
                
                // Enable start button after game over
                document.getElementById('startFlappy').disabled = false;
            }
        } catch (error) {
            console.error('Error updating balance:', error);
            // Still enable start button even if there's an error
            document.getElementById('startFlappy').disabled = false;
        }
    },
    
    addToHistory(multiplier, won) {
        const historyList = document.getElementById('flappyHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${won ? 'win' : 'lose'}`;
        
        const amount = won ? 
            (this.currentBet * multiplier - this.currentBet) : 
            this.currentBet;
        
        historyItem.innerHTML = `
            <div class="history-details">
                <span class="history-result">${multiplier.toFixed(2)}x</span>
                <span class="history-amount ${won ? 'win' : 'lose'}">
                    ${won ? '+' : '-'}$${amount.toFixed(2)}
                </span>
            </div>
            <div class="history-info">
                <span>Bet: $${this.currentBet.toFixed(2)}</span>
                <span>Pipes: ${this.pipesPassed}</span>
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
    }
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    
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
        FlappyGame.init();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
    }
}); 