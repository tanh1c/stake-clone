document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra đăng nhập và quyền admin
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/check-admin', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        if (!data.isAdmin) {
            window.location.href = 'menu.html';
            return;
        }
    } catch (error) {
        window.location.href = 'menu.html';
        return;
    }

    const createBtn = document.getElementById('createBtn');
    const codeInput = document.getElementById('codeInput');
    const amountInput = document.getElementById('amountInput');
    const filterStatus = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');
    const giftcodeList = document.getElementById('giftcodeList');

    // Load danh sách giftcode
    loadGiftcodes();

    createBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        const amount = parseFloat(amountInput.value);

        if (!code || !amount) {
            alert('Please fill all fields');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/admin/create-giftcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code, amount })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Giftcode created successfully');
                codeInput.value = '';
                amountInput.value = '';
                loadGiftcodes();
            } else {
                alert(data.error || 'Error creating giftcode');
            }
        } catch (error) {
            alert('Error creating giftcode');
        }
    });

    filterStatus.addEventListener('change', loadGiftcodes);
    searchInput.addEventListener('input', loadGiftcodes);

    async function loadGiftcodes() {
        try {
            const status = filterStatus.value;
            const search = searchInput.value.trim();

            const response = await fetch(`http://localhost:3000/api/admin/giftcodes?status=${status}&search=${search}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                displayGiftcodes(data.giftcodes);
            }
        } catch (error) {
            console.error('Error loading giftcodes:', error);
        }
    }

    function displayGiftcodes(giftcodes) {
        giftcodeList.innerHTML = '';

        giftcodes.forEach(giftcode => {
            const item = document.createElement('div');
            item.className = `giftcode-item ${giftcode.isUsed ? 'used' : ''}`;

            item.innerHTML = `
                <div class="giftcode-info">
                    <span class="code">${giftcode.code}</span>
                    <span class="amount">$${giftcode.amount.toFixed(2)}</span>
                </div>
                <span class="status ${giftcode.isUsed ? 'used' : 'unused'}">
                    ${giftcode.isUsed ? 'Used' : 'Available'}
                </span>
            `;

            giftcodeList.appendChild(item);
        });
    }
}); 