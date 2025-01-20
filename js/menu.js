document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = 'https://stake-clone-backend.onrender.com/api';
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    // Kiểm tra token và load thông tin người dùng
    try {
        // Load balance
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
        document.querySelector('.balance').textContent = `Balance: $${balanceData.balance.toFixed(2)}`;

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

        // Kiểm tra quyền admin
        const adminCheck = await fetch(`${API_URL}/check-admin`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (adminCheck.ok) {
            const adminData = await adminCheck.json();
            if (adminData.isAdmin) {
                document.querySelector('.admin-only').style.display = 'flex';
            }
        }

    } catch (error) {
        console.error('Error:', error);
        // Chỉ chuyển hướng khi lỗi xác thực
        if (error.message.includes('authentication') || error.message.includes('token')) {
            localStorage.removeItem('token');
            window.location.href = 'auth.html';
        }
    }

    // Handle game card clicks
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const gameId = card.getAttribute('href').split('#')[1];
            localStorage.setItem('selectedGame', gameId);
        });
    });

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