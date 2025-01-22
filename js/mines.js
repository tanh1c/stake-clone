let minesGrid = [];
let selectedTiles = [];
let minesCount = 5;
let isGameActive = false;
let currentBet = 0;
let currentMultiplier = 1.00;
let minePositions = [];

function initializeMines() {
    minesGrid = [];
    selectedTiles = [];
    isGameActive = false;
    minePositions = [];
    currentMultiplier = 1.00;
    updateMultiplier();
    
    // Reset grid
    const grid = document.getElementById('minesGrid');
    grid.innerHTML = '';
    
    // Create 5x5 grid
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.className = 'mine-tile';
        tile.dataset.index = i;
        tile.onclick = () => selectTile(i);
        grid.appendChild(tile);
        minesGrid[i] = 'empty';
    }
}

function startMinesGame() {
    const betAmount = parseFloat(document.getElementById('minesBetAmount').value);
    minesCount = parseInt(document.getElementById('minesCount').value);
    
    if (betAmount > balance) {
        alert('Không đủ số dư!');
        return;
    }
    
    if (minesCount < 1 || minesCount > 24) {
        alert('Số mines phải từ 1 đến 24!');
        return;
    }
    
    currentBet = betAmount;
    updateBalance(-betAmount);
    isGameActive = true;
    selectedTiles = [];
    
    // Place mines randomly
    minePositions = [];
    while (minePositions.length < minesCount) {
        const pos = Math.floor(Math.random() * 25);
        if (!minePositions.includes(pos)) {
            minePositions.push(pos);
            minesGrid[pos] = 'mine';
        }
    }
    
    // Enable all tiles
    document.querySelectorAll('.mine-tile').forEach(tile => {
        tile.className = 'mine-tile';
    });
    
    // Update UI
    document.getElementById('startMines').disabled = true;
    document.getElementById('cashoutMines').disabled = false;
    updateMultiplier();
    
    // Thêm animation cho reset grid
    const tiles = document.querySelectorAll('.mine-tile');
    tiles.forEach((tile, index) => {
        tile.style.opacity = '0';
        tile.style.transform = 'scale(0.5)';
        setTimeout(() => {
            tile.style.opacity = '1';
            tile.style.transform = 'scale(1)';
        }, index * 30);
    });
}

function selectTile(index) {
    if (!isGameActive || selectedTiles.includes(index)) return;
    
    const tile = document.querySelector(`[data-index="${index}"]`);
    selectedTiles.push(index);
    
    // Thêm hiệu ứng click
    tile.style.transform = 'scale(0.9)';
    setTimeout(() => {
        tile.style.transform = '';
    }, 100);
    
    if (minesGrid[index] === 'mine') {
        // Hit a mine - Game Over
        const grid = document.getElementById('minesGrid');
        grid.classList.add('shake');
        
        // Thêm hiệu ứng nổ tuần tự cho các mine
        revealAllMines(true);
        tile.classList.add('mine-exploded');
        
        // Flash màu đỏ
        document.querySelector('.mines-game').classList.add('lose-flash');
        
        endGame(false);
    } else {
        // Safe tile với animation
        tile.style.transition = 'all 0.5s ease';
        tile.classList.add('gem-revealed');
        
        // Update multiplier với animation
        const multiplier = document.getElementById('minesMultiplier');
        multiplier.classList.remove('updated');
        void multiplier.offsetWidth; // Trigger reflow
        multiplier.classList.add('updated');
        
        updateMultiplier();
        
        // Check win condition
        if (selectedTiles.length === (25 - minesCount)) {
            document.querySelector('.mines-game').classList.add('win-flash');
            endGame(true);
        }
    }
}

function revealAllMines(withDelay = false) {
    minePositions.forEach((pos, index) => {
        const tile = document.querySelector(`[data-index="${pos}"]`);
        if (withDelay) {
            setTimeout(() => {
                tile.classList.add('mine-revealed');
            }, index * 100);
        } else {
            tile.classList.add('mine-revealed');
        }
    });
}

function updateMultiplier() {
    const safePicksCount = selectedTiles.length;
    const totalSafeTiles = 25 - minesCount;
    
    if (safePicksCount === 0) {
        currentMultiplier = 1.00;
    } else {
        // Calculate multiplier based on probability
        let probability = 1;
        for (let i = 0; i < safePicksCount; i++) {
            probability *= (totalSafeTiles - i) / (25 - i);
        }
        currentMultiplier = (0.99 / probability).toFixed(2);
    }
    
    document.getElementById('minesMultiplier').textContent = currentMultiplier + 'x';
}

function cashout() {
    if (!isGameActive) return;
    
    const winAmount = currentBet * currentMultiplier;
    
    // Animation cho cashout
    const tiles = document.querySelectorAll('.mine-tile:not(.gem-revealed)');
    tiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.style.transform = 'scale(0)';
            tile.style.opacity = '0';
        }, index * 50);
    });
    
    // Flash màu xanh
    document.querySelector('.mines-game').classList.add('win-flash');
    
    updateBalance(winAmount);
    endGame(true);
}

function endGame(won) {
    isGameActive = false;
    document.getElementById('startMines').disabled = false;
    document.getElementById('cashoutMines').disabled = true;
    
    if (won) {
        // Win animations
        document.getElementById('minesGrid').classList.add('win-animation');
        setTimeout(() => {
            document.getElementById('minesGrid').classList.remove('win-animation');
            cleanupAnimations();
        }, 1000);
    } else {
        // Lose animations
        setTimeout(cleanupAnimations, 1500);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeMines();
    
    document.getElementById('minesCount').addEventListener('input', (e) => {
        const count = parseInt(e.target.value);
        if (count >= 1 && count <= 24) {
            minesCount = count;
            initializeMines();
        }
    });
    
    // Thêm hiệu ứng hover sound (tùy chọn)
    document.querySelectorAll('.mine-tile').forEach(tile => {
        tile.addEventListener('mouseenter', () => {
            tile.style.transform = 'translateY(-2px)';
        });
        
        tile.addEventListener('mouseleave', () => {
            tile.style.transform = 'translateY(0)';
        });
    });
});

// Thêm phần khởi tạo game khi DOM loaded
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
        initializeMines();
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }
});

// Clean up animations
function cleanupAnimations() {
    document.querySelector('.mines-game').classList.remove('win-flash', 'lose-flash');
    document.getElementById('minesGrid').classList.remove('shake');
}

// Cập nhật hàm placeBet
async function placeBet() {
    const betAmount = document.getElementById('minesBetAmount');
    if (!betAmount || !betAmount.value) {
        console.error('Bet amount input not found or empty');
        return;
    }
    
    const amount = parseInt(betAmount.value);
    const minesCount = parseInt(document.getElementById('minesCount').value);

    // Validation
    if (amount > balance) {
        alert('Không đủ số dư!');
        return;
    }

    if (amount < 1 || amount > 100000) {
        alert('Số tiền cược phải từ 1 đến 100000!');
        return;
    }

    // Rest of the function...
}

// Cập nhật hàm addToHistory
function addToHistory(result, won) {
    const historyList = document.getElementById('minesHistory');
    if (!historyList) return;
    
    const betAmount = document.getElementById('minesBetAmount');
    if (!betAmount || !betAmount.value) return;
    
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${won ? 'win' : 'lose'}`;
    historyItem.textContent = result.toFixed(2);
    
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
