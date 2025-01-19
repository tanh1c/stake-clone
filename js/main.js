let token; // Khai báo là biến toàn cục

document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://stake-clone-backend.onrender.com/api';
    
    // Kiểm tra đăng nhập và lấy số dư
    token = localStorage.getItem('token');
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
        updateBalanceDisplay(data.balance);
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = 'auth.html';
        return;
    }

    // Load user info
    try {
        // Load balance
        const balanceResponse = await fetch(`${API_URL}/balance`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            document.querySelector('.balance').textContent = `Balance: $${balanceData.balance.toFixed(2)}`;
        }

        // Load username
        const profileResponse = await fetch(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            document.querySelector('.username').textContent = profileData.username;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
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

    // Game switching logic
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

    // Check for selected game from menu
    const selectedGame = localStorage.getItem('selectedGame');
    if (selectedGame && games[selectedGame]) {
        // Hide all games
        Object.values(games).forEach(game => {
            if (game) game.style.display = 'none';
        });
        // Show selected game
        games[selectedGame].style.display = 'block';
        // Update sidebar active state
        document.querySelectorAll('.sidebar nav ul li').forEach(item => {
            item.classList.remove('active');
            if (item.textContent.trim().toLowerCase() === selectedGame) {
                item.classList.add('active');
            }
        });
        // Clear selected game
        localStorage.removeItem('selectedGame');
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
            }
        });
    });
});

// API functions
const API_URL = 'https://stake-clone-backend.onrender.com/api';

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