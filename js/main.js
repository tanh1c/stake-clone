document.addEventListener('DOMContentLoaded', async () => {
    // Lấy token từ localStorage
    token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    // Xử lý mobile menu
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 200);
    });

    // Xử lý bet amount inputs
    const betInputs = document.querySelectorAll('input[type="number"][id$="BetAmount"]');
    
    betInputs.forEach(input => {
        input.setAttribute('min', '1');
        input.setAttribute('max', '100000');
        input.setAttribute('step', '1');
        
        // Đặt giá trị mặc định
        if (!input.value) {
            input.value = 10;
        }
        
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            let value = parseInt(this.value);
            if (isNaN(value) || value < 1) {
                this.value = 1;
            } else if (value > 100000) {
                this.value = 100000;
            }
        });

        input.addEventListener('paste', function(e) {
            e.preventDefault();
            let pastedText = (e.clipboardData || window.clipboardData).getData('text');
            pastedText = pastedText.replace(/[^0-9]/g, '');
            let value = parseInt(pastedText);
            if (!isNaN(value)) {
                if (value < 1) value = 1;
                if (value > 100000) value = 100000;
                this.value = value;
            }
        });

        input.addEventListener('blur', function() {
            if (this.value === '' || parseInt(this.value) < 1) {
                this.value = 1;
            }
        });
    });

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

    // Touch event handling
    function handleTouchEvents() {
        const gameControls = document.querySelectorAll('.game-controls button');
        
        gameControls.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.classList.add('touch-active');
            });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('touch-active');
            });
        });
    }

    // Call after DOM loaded
    document.addEventListener('DOMContentLoaded', handleTouchEvents);

    async function handleApiRequest(url, options) {
        try {
            const response = await fetch(url, options);
            
            if(response.status === 429) { // Rate limit status
                const retryAfter = response.headers.get('Retry-After');
                console.log(`Rate limited. Try again in ${retryAfter} seconds`);
                // Có thể thêm thông báo cho user
                return;
            }
            
            return await response.json();
        } catch(error) {
            console.error('API request failed:', error);
        }
    }
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