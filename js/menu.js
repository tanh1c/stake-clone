document.addEventListener('DOMContentLoaded', async () => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Lấy số dư từ server
    try {
        const response = await fetch('http://localhost:3000/api/balance', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        
        const data = await response.json();
        const balanceElement = document.querySelector('.balance');
        if (balanceElement) {
            balanceElement.textContent = `Balance: $${data.balance.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        window.location.href = 'auth.html';
        return;
    }

    // Handle game card clicks
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const gameId = card.getAttribute('href').split('#')[1];
            localStorage.setItem('selectedGame', gameId);
        });
    });

    // Load và hiển thị username
    try {
        const response = await fetch('http://localhost:3000/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.querySelector('.username').textContent = data.username;
            
            // Kiểm tra quyền admin
            const adminCheck = await fetch('http://localhost:3000/api/check-admin', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const adminData = await adminCheck.json();
            if (adminData.isAdmin) {
                document.querySelector('.admin-only').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error loading username:', error);
    }

    // Xử lý dropdown menu
    const avatarBtn = document.getElementById('avatarBtn');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Xử lý logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'auth.html';
    });
}); 