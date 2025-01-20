document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    const redeemBtn = document.getElementById('redeemBtn');
    const giftcodeInput = document.getElementById('giftcodeInput');
    const resultMessage = document.getElementById('result-message');
    const historyContainer = document.getElementById('giftcodeHistory');

    // Load lịch sử giftcode
    loadGiftcodeHistory();

    redeemBtn.addEventListener('click', async () => {
        const code = giftcodeInput.value.trim();
        if (!code) {
            showMessage('Please enter a giftcode', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/redeem-giftcode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(`Successfully redeemed! +$${data.amount.toFixed(2)}`, 'success');
                giftcodeInput.value = '';
                addToHistory(code, data.amount);
            } else {
                showMessage(data.error || 'Invalid giftcode', 'error');
            }
        } catch (error) {
            showMessage('Error redeeming giftcode', 'error');
        }
    });

    function showMessage(message, type) {
        resultMessage.textContent = message;
        resultMessage.className = type;
        resultMessage.style.display = 'block';

        setTimeout(() => {
            resultMessage.style.display = 'none';
        }, 3000);
    }

    async function loadGiftcodeHistory() {
        try {
            const response = await fetch(`${API_URL}/giftcode-history`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                data.history.forEach(item => {
                    addToHistory(item.code, item.amount, item.timestamp);
                });
            }
        } catch (error) {
            console.error('Error loading giftcode history:', error);
        }
    }

    function addToHistory(code, amount, timestamp = new Date()) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date(timestamp).toLocaleString();
        historyItem.innerHTML = `
            <span class="code">${code}</span>
            <span class="amount">+$${amount.toFixed(2)}</span>
            <span class="date">${date}</span>
        `;

        if (historyContainer.firstChild) {
            historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        } else {
            historyContainer.appendChild(historyItem);
        }
    }
}); 