const PlinkoGame = {
    canvas: null,
    ctx: null,
    width: 1000,
    height: 800,
    pins: [],
    balls: [],
    pinSize: 3,
    ballSize: 5,
    rows: 16,
    multipliers: [],
    
    init() {
        this.canvas = document.getElementById('plinkoCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Initialize pins
        this.setupPins();
        
        // Setup multipliers based on risk
        this.setupMultipliers('medium');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
    },
    
    setupPins() {
        const spacing = this.width / (this.rows + 1);
        const startY = 80;
        
        for (let row = 0; row < this.rows; row++) {
            const pins = row + 3;
            const offsetX = (this.width - (pins - 1) * spacing) / 2;
            
            for (let i = 0; i < pins; i++) {
                this.pins.push({
                    x: offsetX + i * spacing,
                    y: startY + row * spacing,
                    size: this.pinSize
                });
            }
        }
    },
    
    setupMultipliers(risk) {
        const multiplierSlots = document.querySelector('.multiplier-slots');
        multiplierSlots.innerHTML = '';
        
        let multipliers;
        switch(risk) {
            case 'low':
                multipliers = [1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
                break;
            case 'medium':
                multipliers = [3.0, 1.5, 1.4, 1.3, 1.2, 1.0, 0.5, 0.3, 0.5, 1.0, 1.2, 1.3, 1.4, 1.5, 3.0];
                break;
            case 'high':
                multipliers = [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110];
                break;
            default:
                multipliers = [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110];
        }
        
        this.multipliers = multipliers;
        
        // Create multiplier slots
        multipliers.forEach(mult => {
            const slot = document.createElement('div');
            slot.className = 'multiplier-slot';
            slot.textContent = `${mult}x`;
            multiplierSlots.appendChild(slot);
        });
    },
    
    setupEventListeners() {
        // Drop ball button
        document.getElementById('dropBall').addEventListener('click', () => this.dropBall());
        
        // Risk selector
        document.getElementById('plinkoRisk').addEventListener('change', (e) => {
            this.setupMultipliers(e.target.value);
        });
        
        // Rows selector
        document.getElementById('plinkoRows').addEventListener('change', (e) => {
            this.rows = parseInt(e.target.value);
            this.pins = [];
            this.setupPins();
        });
        
        // Bet amount controls
        document.getElementById('halfPlinkoBet').addEventListener('click', () => {
            const input = document.getElementById('plinkoBetAmount');
            input.value = (parseFloat(input.value) / 2).toFixed(2);
        });
        
        document.getElementById('doublePlinkoBet').addEventListener('click', () => {
            const input = document.getElementById('plinkoBetAmount');
            input.value = (parseFloat(input.value) * 2).toFixed(2);
        });
        
        document.getElementById('maxPlinkoBet').addEventListener('click', () => {
            document.getElementById('plinkoBetAmount').value = balance.toFixed(2);
        });
    },
    
    dropBall() {
        const betAmount = document.getElementById('plinkoBetAmount');
        if (!betAmount || !betAmount.value) {
            console.error('Bet amount input not found or empty');
            return;
        }
        
        const amount = parseInt(betAmount.value);
        const riskLevel = document.getElementById('plinkoRisk').value;
        const rows = parseInt(document.getElementById('plinkoRows').value);

        // Validation
        if (amount > balance) {
            alert('Không đủ số dư!');
            return;
        }

        if (amount < 1 || amount > 100000) {
            alert('Số tiền cược phải từ 1 đến 100000!');
            return;
        }
        
        updateBalance(-amount);
        
        // Luôn thả bóng từ vị trí giữa
        const centerX = this.width / 2;
        
        // Thêm bóng mới với vị trí cố định ở giữa
        this.balls.push({
            x: centerX,
            y: 0,
            size: this.ballSize,
            vx: 0, // Vận tốc ngang ban đầu = 0
            vy: 2,
            speed: 2,
            betAmount: amount
        });
    },
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw pins
        this.pins.forEach(pin => {
            this.ctx.beginPath();
            this.ctx.arc(pin.x, pin.y, pin.size, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            this.ctx.closePath();
        });
        
        // Draw balls
        this.balls.forEach(ball => {
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
            this.ctx.fillStyle = '#00FF7F';
            this.ctx.shadowColor = '#00FF7F';
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.closePath();
            this.ctx.shadowBlur = 0;
        });
        
        // Draw slot dividers
        const slotWidth = this.width / this.multipliers.length;
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 1; i < this.multipliers.length; i++) {
            const x = i * slotWidth;
            this.ctx.moveTo(x, this.height - 50);
            this.ctx.lineTo(x, this.height);
        }
        
        this.ctx.stroke();
    },
    
    update() {
        // Update ball physics
        this.balls.forEach((ball, index) => {
            // Giảm gravity để bóng rơi chậm hơn
            ball.vy += 0.3; // Giảm từ 0.5 xuống 0.3
            
            // Giảm random movement để bóng ít bay ngang hơn
            ball.vx += (Math.random() - 0.5) * 0.15; // Giảm từ 0.3 xuống 0.15
            
            // Tăng air resistance để bóng chậm hơn
            ball.vx *= 0.98; // Tăng từ 0.99 lên 0.98
            ball.vy *= 0.98;
            
            // Apply velocity
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Check pin collisions
            this.pins.forEach(pin => {
                const dx = ball.x - pin.x;
                const dy = ball.y - pin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball.size + pin.size) {
                    // Tính toán góc va chạm
                    const angle = Math.atan2(dy, dx);
                    
                    // Áp dụng độ lệch có xu hướng về giữa
                    const deflection = this.calculateDeflection();
                    
                    // Cập nhật vận tốc với độ lệch mới
                    ball.vx = Math.cos(angle + deflection) * ball.speed;
                    ball.vy = Math.abs(Math.sin(angle + deflection) * ball.speed);
                    
                    // Di chuyển bóng ra khỏi pin để tránh va chạm lặp
                    ball.x = pin.x + (ball.size + pin.size + 1) * Math.cos(angle);
                    ball.y = pin.y + (ball.size + pin.size + 1) * Math.sin(angle);
                }
            });
            
            // Add wall collisions with reduced bounce
            if (ball.x < ball.size) {
                ball.x = ball.size;
                ball.vx *= -0.3; // Giảm từ -0.5 xuống -0.3
            }
            if (ball.x > this.width - ball.size) {
                ball.x = this.width - ball.size;
                ball.vx *= -0.3;
            }
            
            // Check if ball reached bottom
            if (ball.y > this.height - ball.size) {
                // Tính toán chính xác vị trí slot dựa trên tọa độ x của ball
                const slotWidth = this.width / this.multipliers.length;
                
                // Chuyển đổi tọa độ canvas sang tọa độ thực
                let slotIndex = Math.floor(ball.x / slotWidth);
                
                // Đảm bảo index nằm trong khoảng hợp lệ
                slotIndex = Math.max(0, Math.min(slotIndex, this.multipliers.length - 1));
                
                // Lấy multiplier tương ứng với slot
                const multiplier = this.multipliers[slotIndex];
                
                // Add win to balance
                const winAmount = ball.betAmount * multiplier;
                updateBalance(winAmount);
                
                // Highlight winning slot với index chính xác
                this.highlightWinningSlot(slotIndex);
                
                // Add to history
                this.addToHistory(multiplier, winAmount);
                
                // Remove ball
                this.balls.splice(index, 1);
            }
        });
    },
    
    animate() {
        this.draw();
        this.update();
        requestAnimationFrame(() => this.animate());
    },
    
    addToHistory(result, amount) {
        const historyList = document.getElementById('plinkoHistory');
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${result > 1 ? 'win' : 'lose'}`;
        
        // Thêm nội dung cho history item
        historyItem.textContent = result > 1 ? 
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
    },
    
    highlightWinningSlot(index) {
        // Highlight multiplier slot
        const slots = document.querySelectorAll('.multiplier-slot');
        const winningSlot = slots[index];
        
        // Remove previous highlights
        slots.forEach(slot => {
            slot.classList.remove('highlight');
        });
        
        // Add highlight to winning slot
        winningSlot.classList.add('highlight');
        
        // Get the actual canvas dimensions
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate exact slot position
        const slotWidth = canvasRect.width / this.multipliers.length;
        const pathX = (index * slotWidth) + (slotWidth / 2);
        
        // Create landing path at exact position
        const path = document.createElement('div');
        path.className = 'landing-path';
        path.style.left = `${pathX}px`;
        path.style.height = '50px';
        path.style.position = 'absolute';
        
        const boardContainer = this.canvas.parentElement;
        boardContainer.style.position = 'relative';
        boardContainer.appendChild(path);
        
        // Show path
        requestAnimationFrame(() => {
            path.classList.add('show');
        });
        
        // Remove path after animation
        setTimeout(() => {
            path.remove();
        }, 1000);
        
        // Add win amount display at exact position
        const winAmount = document.createElement('div');
        winAmount.className = 'win-amount';
        winAmount.textContent = `${this.multipliers[index]}x`;
        winAmount.style.position = 'absolute';
        winAmount.style.left = `${pathX}px`;
        winAmount.style.bottom = '60px';
        winAmount.style.color = '#00FF7F';
        winAmount.style.fontWeight = 'bold';
        winAmount.style.textShadow = '0 0 10px rgba(0,255,127,0.5)';
        winAmount.style.animation = 'fadeOutUp 1s ease forwards';
        winAmount.style.zIndex = '10';
        
        boardContainer.appendChild(winAmount);
        
        // Remove win amount after animation
        setTimeout(() => {
            winAmount.remove();
        }, 1000);
    },
    
    calculateDeflection() {
        // Tạo độ lệch có xu hướng về giữa
        const centerBias = 0.5; // 70% xu hướng về giữa
        const randomFactor = Math.random();
        
        if (randomFactor < centerBias) {
            // Tạo độ lệch nhỏ quanh khu vực giữa
            return (Math.random() - 0.5) * 0.3; // Độ lệch nhỏ ±0.15
        } else {
            // Độ lệch ngẫu nhiên cho các trường hợp còn lại
            return (Math.random() - 0.5) * 0.8; // Độ lệch lớn hơn ±0.4
        }
    }
};

// Thêm keyframe animation cho win amount
const style = document.createElement('style');
style.textContent = `
@keyframes fadeOutUp {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-20px);
    }
}
`;
document.head.appendChild(style);

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
        PlinkoGame.init();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});