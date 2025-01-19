const API_URL = 'https://stake-clone-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    // Load user data
    try {
        const response = await fetch(`${API_URL}/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const data = await response.json();
        document.getElementById('usernameInput').value = data.username;
        document.getElementById('emailInput').value = data.email;
    } catch (error) {
        console.error('Error loading profile:', error);
    }

    // Handle form submission
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('emailInput').value;
        const currentPassword = document.getElementById('currentPasswordInput').value;
        const newPassword = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;

        if (newPassword && newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/profile/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email,
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Profile updated successfully');
                window.location.href = 'menu.html';
            } else {
                alert(data.error || 'Error updating profile');
            }
        } catch (error) {
            alert('Error updating profile');
        }
    });

    // Handle avatar upload
    const avatarInput = document.getElementById('avatarInput');
    const avatar = document.querySelector('.avatar');

    avatar.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch(`${API_URL}/profile/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('userAvatar').src = data.avatarUrl;
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
        }
    });
}); 