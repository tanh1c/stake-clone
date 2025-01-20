let token; // Khai báo là biến toàn cục

document.addEventListener('DOMContentLoaded', async () => {
    token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    // Kiểm tra và hiển thị game được chọn trước khi load balance
    const games = {
        'dice': document.querySelector('[data-game="dice"]'),
        'mines': document.querySelector('[data-game="mines"]'),
        'crash': document.querySelector('[data-game="crash"]'),
        'roulette': document.querySelector('[data-game="roulette"]'),
        'plinko': document.querySelector('[data-game="plinko"]'),
        'blackjack': document.querySelector('[data-game="blackjack"]'),
        'hilo': document.querySelector('[data-game="hilo"]'),
        'double-dice': document.querySelector('[data-game="double-dice"]'),
        'limbo': document.querySelector('[data-game="limbo"]'),
        'slot': document.querySelector('[data-game="slot"]')
    };

    // Lấy game từ URL hash hoặc localStorage
    const gameId = window.location.hash.substring(1) || localStorage.getItem('selectedGame');
    if (gameId && games[gameId]) {
        Object.values(games).forEach(game => {
            if (game) game.style.display = 'none';
        });
        games[gameId].style.display = 'block';
        
        document.querySelectorAll('.sidebar nav ul li').forEach(item => {
            item.classList.remove('active');
            if (item.textContent.trim().toLowerCase() === gameId) {
                item.classList.add('active');
            }
        });
    }

    // Xóa selectedGame từ localStorage sau khi đã hiển thị game
    localStorage.removeItem('selectedGame');

    try {
        const balanceResponse = await fetch(`${API_URL}/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!balanceResponse.ok) {
            if (balanceResponse.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'auth.html';
                return;
            }
            throw new Error('Failed to load balance');
        }
        
        const balanceData = await balanceResponse.json();
        updateBalanceDisplay(balanceData.balance);

        // Load username
        const profileResponse = await fetch(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to load profile');
        }

        const profileData = await profileResponse.json();
        document.querySelector('.username').textContent = profileData.username;

    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('Failed to load')) {
            localStorage.removeItem('token');
            window.location.href = 'auth.html';
        }
        return;
    }

    // Hàm cập nhật hiển thị số dư
    function updateBalanceDisplay(amount) {
        const balanceElement = document.querySelector('.balance');
        if (balanceElement) {
            balanceElement.textContent = `Balance: $${amount.toFixed(2)}`;
        }
    }

    // Hàm cập nhật số dư với server
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
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = 'auth.html';
                    return null;
                }
                throw new Error('Failed to update balance');
            }
            
            const data = await response.json();
            if (data.balance) {
                updateBalanceDisplay(data.balance);
            }
            return data.balance;
        } catch (error) {
            console.error('Update balance error:', error);
            return null;
        }
    }

    // Handle sidebar navigation
    document.querySelectorAll('.sidebar nav ul li').forEach(item => {
        item.addEventListener('click', () => {
            const gameName = item.textContent.trim().toLowerCase().replace(/\s+/g, '-');
            
            // Update active state
            document.querySelectorAll('.sidebar nav ul li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show selected game
            Object.values(games).forEach(game => {
                if (game) game.style.display = 'none';
            });
            if (games[gameName]) {
                games[gameName].style.display = 'block';
                window.history.pushState(null, '', `#${gameName}`);
            }
        });
    });
});

// API functions
async function login(username, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('balance', data.balance);
        updateBalanceDisplay(data.balance);
    }
    return data;
}

async function updateBalance(amount) {
    const token = localStorage.getItem('token');
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
        localStorage.setItem('balance', data.balance);
        updateBalanceDisplay(data.balance);
    }
    return data;
}

async function addGameHistory(gameData) {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/gameHistory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
    });
}

// Bet amount control functions
function halfBet(inputId) {
    const input = document.getElementById(inputId);
    input.value = (parseFloat(input.value) / 2).toFixed(2);
}

function doubleBet(inputId) {
    const input = document.getElementById(inputId);
    input.value = (parseFloat(input.value) * 2).toFixed(2);
}

function maxBet(inputId) {
    const input = document.getElementById(inputId);
    input.value = balance.toFixed(2);
} 