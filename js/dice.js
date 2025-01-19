let balance;
let isAutoBetting = false;
let autoBetInterval = null;
let hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true';
let totalBets = 0;
let totalWins = 0;
let totalLosses = 0;
let highestWin = 0;
let highestLoss = 0;
let initialBalance = balance;
let originalBetAmount = 0;
let currentStreak = 0;
let bestStreak = 0;
let worstStreak = 0;
let autoBetCount = 0;

async function handleWin(amount) {
    const newBalance = await updateBalance(amount);
    if (newBalance !== null) {
        // Xử lý thắng
        showGameResult('win', amount);
    }
}

async function handleLoss(amount) {
    const newBalance = await updateBalance(-amount);
    if (newBalance !== null) {
        // Xử lý thua
        showGameResult('lose', amount);
    }
}

async function updateBalance(amount) {
    try {
        const response = await fetch(`${API_URL}/updateBalance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });
        
        const data = await response.json();
        if (data.balance) {
            balance = data.balance;
            document.querySelector('.balance').textContent = `Balance: $${balance.toFixed(2)}`;
        }
        return true;
    } catch (error) {
        console.error('Update balance error:', error);
        return false;
    }
}

function calculateMultiplier(winChance) {
    return (99 / winChance).toFixed(2);
}

function addToHistory(result, won) {
    const historyList = document.getElementById('diceHistory');
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${won ? 'win' : 'lose'}`;
    
    const betAmount = document.getElementById('betAmount').value;
    const winChance = document.getElementById('winChance').value;
    const multiplier = calculateMultiplier(winChance);
    
    // Tính số tiền thắng/thua
    const amount = won ? (betAmount * multiplier - betAmount) : betAmount;
    
    historyItem.innerHTML = `
        <div class="history-details">
            <span class="history-result">${result.toFixed(2)}</span>
            <span class="history-amount ${won ? 'win' : 'lose'}">
                ${won ? '+' : '-'}$${amount.toFixed(2)}
            </span>
        </div>
        <div class="history-info">
            <span>Bet: $${betAmount}</span>
            <span>Chance: ${winChance}%</span>
            <span>Multi: ${multiplier}x</span>
        </div>
    `;
    
    // Thêm vào đầu danh sách
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }
    
    // Giới hạn số lượng lịch sử
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
    
    // Animation cho item mới
    requestAnimationFrame(() => {
        historyItem.style.opacity = '1';
        historyItem.style.transform = 'translateY(0)';
    });
}

function animateRoll(duration, finalNumber) {
    const rollResult = document.getElementById('rollResult');
    const diceAnimation = document.querySelector('.dice-animation');
    const progress = document.getElementById('rollProgress');
    let startTime = null;
    
    // Thêm class rolling cho container
    diceAnimation.classList.add('rolling');
    rollResult.classList.remove('win', 'lose');
    
    // Thêm hiệu ứng rung lắc
    rollResult.style.animation = 'shakeDice 0.2s ease infinite';
    
    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Animate số với hiệu ứng random
        const currentNumber = (Math.random() * 100).toFixed(2);
        rollResult.textContent = currentNumber;
        
        // Animate progress bar
        document.getElementById('rollProgress').style.width = `${progress * 100}%`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Kết thúc animation
            rollResult.style.animation = '';
            rollResult.textContent = finalNumber.toFixed(2);
            diceAnimation.classList.remove('rolling');
            
            // Thêm class win/lose
            if (finalNumber <= parseFloat(document.getElementById('winChance').value)) {
                rollResult.classList.add('win');
            } else {
                rollResult.classList.add('lose');
            }
            
            setTimeout(() => {
                document.getElementById('rollProgress').style.width = '0%';
            }, 500);
        }
    }
    
    requestAnimationFrame(animate);
}

function updateStats(won, betAmount, profitLoss) {
    totalBets++;
    
    if (won) {
        totalWins++;
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        if (profitLoss > highestWin) highestWin = profitLoss;
    } else {
        totalLosses++;
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
        if (currentStreak < worstStreak) worstStreak = currentStreak;
        if (-profitLoss > highestLoss) highestLoss = -profitLoss;
    }
    
    // Cập nhật hiển thị
    document.getElementById('totalBets').textContent = totalBets;
    document.getElementById('winRate').textContent = ((totalWins/totalBets)*100).toFixed(2) + '%';
    document.getElementById('profit').textContent = (balance - initialBalance).toFixed(2);
    document.getElementById('bestStreak').textContent = bestStreak;
    document.getElementById('worstStreak').textContent = worstStreak;
    
    // Thêm hiệu ứng pop khi cập nhật
    const elements = ['totalBets', 'winRate', 'profit', 'bestStreak', 'worstStreak'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        element.classList.remove('updated');
        void element.offsetWidth; // Trigger reflow
        element.classList.add('updated');
    });
}

async function rollDice() {
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const winChance = parseFloat(document.getElementById('winChance').value);
    
    // Validation
    if (betAmount > balance) {
        alert('Không đủ số dư!');
        stopAutoBet();
        return;
    }
    
    if (winChance < 1 || winChance > 95) {
        alert('Tỷ lệ thắng phải từ 1 đến 95!');
        stopAutoBet();
        return;
    }

    const result = Math.random() * 100;
    const won = result <= winChance;
    
    // Animate roll
    animateRoll(1000, result);
    
    const rollResult = document.getElementById('rollResult');
    
    setTimeout(async () => {
        if (won) {
            const multiplier = parseFloat(calculateMultiplier(winChance));
            const winAmount = betAmount * multiplier;
            const profit = winAmount - betAmount;
            const updated = await updateBalance(profit);
            if (!updated) return;
            updateStats(true, betAmount, profit);
            
            // Xử lý auto bet khi thắng
            if (isAutoBetting) {
                handleAutoBetResult(true);
            }
        } else {
            const updated = await updateBalance(-betAmount);
            if (!updated) return;
            updateStats(false, betAmount, -betAmount);
            
            // Xử lý auto bet khi thua
            if (isAutoBetting) {
                handleAutoBetResult(false);
            }
        }
        
        addToHistory(result, won);
        
        if (isAutoBetting) {
            setTimeout(rollDice, 1000);
        }
    }, 1000);
}

// Bet control functions
function halfBet() {
    const betInput = document.getElementById('betAmount');
    betInput.value = (parseFloat(betInput.value) / 2).toFixed(2);
}

function doubleBet() {
    const betInput = document.getElementById('betAmount');
    betInput.value = (parseFloat(betInput.value) * 2).toFixed(2);
}

function maxBet() {
    document.getElementById('betAmount').value = balance.toFixed(2);
}

// Auto bet functions
function startAutoBet() {
    isAutoBetting = true;
    originalBetAmount = parseFloat(document.getElementById('betAmount').value);
    autoBetCount = 0;
    rollDice();
}

function stopAutoBet() {
    isAutoBetting = false;
}

// Event Listeners
document.getElementById('winChance').addEventListener('input', function(e) {
    const winChance = parseFloat(e.target.value);
    if (winChance >= 1 && winChance <= 95) {
        document.getElementById('multiplier').textContent = 
            calculateMultiplier(winChance) + 'x';
    }
});

document.getElementById('autoBet').addEventListener('change', function(e) {
    if (e.target.checked) {
        startAutoBet();
    } else {
        stopAutoBet();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (!isAutoBetting) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                rollDice();
                break;
            case 'KeyQ':
                halfBet();
                break;
            case 'KeyW':
                doubleBet();
                break;
            case 'KeyE':
                maxBet();
                break;
        }
    }
});

function openTutorial() {
    document.getElementById('tutorialModal').style.display = 'block';
}

function closeTutorial() {
    document.getElementById('tutorialModal').style.display = 'none';
    if (document.getElementById('dontShowAgain').checked) {
        localStorage.setItem('hasSeenTutorial', 'true');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (!hasSeenTutorial) {
        openTutorial();
    }
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('tutorialModal');
    if (event.target === modal) {
        closeTutorial();
    }
});

// Thêm hàm xử lý kết quả auto bet
function handleAutoBetResult(won) {
    const betInput = document.getElementById('betAmount');
    const currentBet = parseFloat(betInput.value);
    
    if (won) {
        const action = document.getElementById('onWinAction').value;
        const value = parseFloat(document.getElementById('onWinValue').value) / 100;
        
        switch(action) {
            case 'reset':
                betInput.value = originalBetAmount;
                break;
            case 'increase':
                betInput.value = (currentBet * value).toFixed(2);
                break;
            case 'stop':
                stopAutoBet();
                return;
        }
    } else {
        const action = document.getElementById('onLoseAction').value;
        const value = parseFloat(document.getElementById('onLoseValue').value) / 100;
        
        switch(action) {
            case 'reset':
                betInput.value = originalBetAmount;
                break;
            case 'increase':
                betInput.value = (currentBet * value).toFixed(2);
                break;
            case 'stop':
                stopAutoBet();
                return;
        }
    }
    
    // Kiểm tra điều kiện dừng
    const profit = balance - initialBalance;
    const stopOnProfit = document.getElementById('stopOnProfit').checked;
    const stopOnLoss = document.getElementById('stopOnLoss').checked;
    const profitLimit = parseFloat(document.getElementById('profitAmount').value);
    const lossLimit = parseFloat(document.getElementById('lossAmount').value);
    
    if ((stopOnProfit && profit >= profitLimit) || 
        (stopOnLoss && -profit >= lossLimit)) {
        stopAutoBet();
        return;
    }
    
    // Kiểm tra số lần bet
    const maxBets = parseInt(document.getElementById('autoBetCount').value);
    if (maxBets > 0) {
        autoBetCount++;
        if (autoBetCount >= maxBets) {
            stopAutoBet();
            return;
        }
    }
    
    // Tiếp tục auto bet
    setTimeout(rollDice, 1000);
}

// Thêm hiệu ứng cho các nút điều khiển
document.querySelectorAll('.bet-controls button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
});

// Thêm hiệu ứng ripple cho nút Roll
document.querySelector('.roll-button').addEventListener('click', function(e) {
    let ripple = document.createElement('div');
    ripple.className = 'ripple';
    this.appendChild(ripple);
    
    let rect = this.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    setTimeout(() => {
        ripple.remove();
    }, 1000);
});

document.addEventListener('DOMContentLoaded', async () => {
    // Lấy token từ localStorage
    token = localStorage.getItem('token');
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
        initialBalance = balance;
        document.querySelector('.balance').textContent = `Balance: $${balance.toFixed(2)}`;
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
}); 