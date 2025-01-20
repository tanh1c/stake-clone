document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://stake-clone-backend.onrender.com/api';
    
    // Kiểm tra nếu đã đăng nhập thì chuyển đến menu
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'menu.html';
        return;
    }
    
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}Form`) {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('balance', data.balance);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', data.username);
                window.location.href = 'menu.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(loginForm, error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        }
    });
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showError(registerForm, 'Mật khẩu không khớp');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.token) {
                showSuccess(registerForm, 'Đăng ký thành công! Đang chuyển hướng...');
                setTimeout(() => {
                    window.location.href = 'menu.html';
                }, 1500);
            } else {
                showError(registerForm, data.error);
            }
        } catch (error) {
            showError(registerForm, 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    });
    
    // Helper functions
    function showError(form, message) {
        const errorDiv = form.querySelector('.error-message') || document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        if (!form.querySelector('.error-message')) {
            form.appendChild(errorDiv);
        }
    }
    
    function showSuccess(form, message) {
        const successDiv = form.querySelector('.success-message') || document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        if (!form.querySelector('.success-message')) {
            form.appendChild(successDiv);
        }
    }
}); 