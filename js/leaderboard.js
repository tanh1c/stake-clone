document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/leaderboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load leaderboard');
        }

        const data = await response.json();
        displayLeaderboard(data.players);
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
});

function displayLeaderboard(players) {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    players.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        playerItem.innerHTML = `
            <div class="rank">#${index + 1}</div>
            <div class="player">
                <img src="https://w7.pngwing.com/pngs/177/551/png-transparent-user-interface-design-computer-icons-default-stephen-salazar-graphy-user-interface-design-computer-wallpaper-sphere-thumbnail.png" alt="User">
                <span>${player.username}</span>
            </div>
            <div class="balance">$${player.balance.toFixed(2)}</div>
        `;

        leaderboardList.appendChild(playerItem);
    });
} 