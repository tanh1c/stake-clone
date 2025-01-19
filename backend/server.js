require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

app.use(cors({
    origin: '*',  // Tạm thời cho phép tất cả các origin trong quá trình dev
    credentials: true
}));
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI);

// User Model
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    balance: { type: Number, default: 1000 },
    isAdmin: { type: Boolean, default: false },
    gameHistory: [{
        game: String,
        bet: Number,
        result: String,
        profit: Number,
        timestamp: Date
    }]
});

const User = mongoose.model('User', userSchema);

// Giftcode Model
const giftcodeSchema = new mongoose.Schema({
    code: { type: String, unique: true },
    amount: Number,
    isUsed: { type: Boolean, default: false },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: Date
});

const Giftcode = mongoose.model('Giftcode', giftcodeSchema);

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            email,
            password: hashedPassword,
            isAdmin: username === 'admin'
        });
        
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'User not found' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        console.log('Login successful:', username);
        res.json({ token, balance: user.balance });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Middleware xác thực
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });
        
        if (!user) {
            throw new Error();
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Middleware kiểm tra token hết hạn
const checkTokenExpiration = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kiểm tra thời gian hết hạn
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            throw new Error('Token expired');
        }
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token invalid or expired' });
    }
};

// Middleware kiểm tra admin
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });
        
        if (!user || !user.isAdmin) {
            throw new Error();
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Access denied' });
    }
};

// Protected routes
app.get('/api/balance', [checkTokenExpiration, auth], async (req, res) => {
    res.json({ balance: req.user.balance });
});

app.post('/api/updateBalance', [checkTokenExpiration, auth], async (req, res) => {
    try {
        const { amount } = req.body;
        req.user.balance += amount;
        await req.user.save();
        
        // Thêm vào lịch sử giao dịch
        req.user.gameHistory.push({
            game: 'balance_update',
            amount: amount,
            balance: req.user.balance,
            timestamp: new Date()
        });
        await req.user.save();
        
        res.json({ balance: req.user.balance });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/gameHistory', auth, async (req, res) => {
    try {
        const { game, bet, result, profit } = req.body;
        req.user.gameHistory.push({
            game,
            bet,
            result,
            profit,
            timestamp: new Date()
        });
        await req.user.save();
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Giftcode routes
app.post('/api/redeem-giftcode', auth, async (req, res) => {
    try {
        const { code } = req.body;
        
        const giftcode = await Giftcode.findOne({ code, isUsed: false });
        if (!giftcode) {
            return res.status(400).json({ error: 'Invalid or already used giftcode' });
        }
        
        // Cập nhật giftcode
        giftcode.isUsed = true;
        giftcode.usedBy = req.user._id;
        giftcode.usedAt = new Date();
        await giftcode.save();
        
        // Cộng tiền cho user
        req.user.balance += giftcode.amount;
        await req.user.save();
        
        res.json({ amount: giftcode.amount });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/giftcode-history', auth, async (req, res) => {
    try {
        const giftcodes = await Giftcode.find({ usedBy: req.user._id })
            .sort({ usedAt: -1 })
            .limit(10);
            
        res.json({
            history: giftcodes.map(gc => ({
                code: gc.code,
                amount: gc.amount,
                timestamp: gc.usedAt
            }))
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Admin routes
app.post('/api/admin/create-giftcode', adminAuth, async (req, res) => {
    try {
        const { code, amount } = req.body;
        
        const giftcode = new Giftcode({
            code,
            amount,
            isUsed: false
        });
        
        await giftcode.save();
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/admin/giftcodes', adminAuth, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};
        
        if (status === 'unused') {
            query.isUsed = false;
        } else if (status === 'used') {
            query.isUsed = true;
        }
        
        if (search) {
            query.code = new RegExp(search, 'i');
        }
        
        const giftcodes = await Giftcode.find(query).sort({ createdAt: -1 });
        res.json({ giftcodes });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Check admin status
app.get('/api/check-admin', auth, async (req, res) => {
    res.json({ isAdmin: req.user.isAdmin });
});

// Profile routes
app.get('/api/profile', auth, async (req, res) => {
    res.json({
        username: req.user.username,
        email: req.user.email
    });
});

app.post('/api/profile/update', auth, async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;
        
        // Kiểm tra mật khẩu hiện tại nếu muốn đổi mật khẩu
        if (newPassword) {
            const validPassword = await bcrypt.compare(currentPassword, req.user.password);
            if (!validPassword) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
            req.user.password = await bcrypt.hash(newPassword, 10);
        }
        
        req.user.email = email;
        await req.user.save();
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Leaderboard route
app.get('/api/leaderboard', auth, async (req, res) => {
    try {
        const players = await User.find({})
            .select('username balance')
            .sort({ balance: -1 })
            .limit(100);
        
        res.json({ players });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 