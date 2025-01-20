require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { basicLimiter, authLimiter, gameLimiter } = require('./middleware/rateLimiter');
const { validateInput, handleValidation } = require('./middleware/validator');
const http = require('http');
const socketIO = require('socket.io');
const BlackjackRoom = require('./models/BlackjackRoom');

const app = express();

// Security middleware
app.use(helmet());
app.use(basicLimiter);
app.use(mongoSanitize());

app.use(cors({
    origin: '*',  // Tạm thời cho phép tất cả các origin trong quá trình dev
    credentials: true
}));
app.use(express.json());

// Áp dụng rate limiter cho routes cụ thể
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/game', gameLimiter);

// DDoS protection middleware
app.use((req, res, next) => {
    // Kiểm tra User-Agent
    const userAgent = req.headers['user-agent'];
    if (!userAgent || userAgent.length < 10) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    // Kiểm tra các header bất thường
    const suspiciousHeaders = [
        'x-forwarded-for',
        'forwarded',
        'x-real-ip',
        'x-originating-ip',
        'cf-connecting-ip'
    ];
    
    for (const header of suspiciousHeaders) {
        if (req.headers[header] && req.headers[header].split(',').length > 3) {
            return res.status(403).json({ error: 'Suspicious request detected' });
        }
    }
    
    next();
});

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
app.post('/api/register', validateInput.register, handleValidation, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Kiểm tra user tồn tại an toàn hơn
        const existingUser = await User.findOne({
            $or: [
                { username: { $eq: username } },
                { email: { $eq: email } }
            ]
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
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

app.post('/api/login', validateInput.login, handleValidation, async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { username, password } = req.body;
        const user = await User.findOne({ username }).select('+password');
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { 
                userId: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('Login successful:', username);
        res.json({ 
            token,
            balance: user.balance,
            username: user.username
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware xác thực
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            throw new Error('No token provided');
        }
        const token = authHeader.replace('Bearer ', '');
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ _id: decoded.userId });
            
            if (!user) {
                throw new Error('User not found');
            }
            
            req.user = user;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            res.status(401).json({ error: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Please authenticate' });
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
app.get('/api/balance', auth, async (req, res) => {
    res.json({ balance: req.user.balance });
});

app.post('/api/updateBalance', auth, async (req, res) => {
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

// Thêm route refresh token
app.post('/api/refresh-token', async (req, res) => {
    try {
        const oldToken = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
        
        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
            throw new Error();
        }
        
        const newToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ token: newToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Game routes với validation
app.post('/api/game/bet', auth, validateInput.gameAction, handleValidation, async (req, res) => {
    // ... code xử lý game
});

// Tạo HTTP server
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Handle WebSocket errors
io.on('connect_error', (err) => {
    console.log('Socket connection error:', err);
});

io.on('connect_timeout', () => {
    console.log('Socket connection timeout');
});

// WebSocket handlers
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
    
    // Tham gia phòng
    socket.on('joinRoom', async (data) => {
        try {
            const { roomId, userId, username } = data;
            let room = await BlackjackRoom.findOne({ roomId });
            
            if (!room) {
                room = new BlackjackRoom({
                    roomId,
                    players: [{
                        userId,
                        username,
                        cards: [],
                        bet: 0
                    }]
                });
            } else if (room.players.length < 7) { // Max 7 players
                room.players.push({
                    userId,
                    username,
                    cards: [],
                    bet: 0
                });
            }
            
            await room.save();
            socket.join(roomId);
            io.to(roomId).emit('roomUpdate', room);
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    // Đặt cược
    socket.on('placeBet', async (data) => {
        try {
            const { roomId, userId, bet } = data;
            const room = await BlackjackRoom.findOne({ roomId });
            
            const player = room.players.find(p => p.userId.toString() === userId);
            if (player) {
                player.bet = bet;
                player.ready = true;
                await room.save();
                
                // Kiểm tra nếu tất cả người chơi đã sẵn sàng
                if (room.players.every(p => p.ready)) {
                    startGame(room);
                }
                
                io.to(roomId).emit('roomUpdate', room);
            }
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    // Rút bài
    socket.on('hit', async (data) => {
        try {
            const { roomId, userId } = data;
            const room = await BlackjackRoom.findOne({ roomId });
            
            const playerIndex = room.players.findIndex(p => p.userId.toString() === userId);
            if (playerIndex === room.currentTurn) {
                const card = room.deck.pop();
                room.players[playerIndex].cards.push(card);
                
                // Kiểm tra bust
                if (calculateHandValue(room.players[playerIndex].cards) > 21) {
                    room.players[playerIndex].stand = true;
                    nextTurn(room);
                }
                
                await room.save();
                io.to(roomId).emit('roomUpdate', room);
            }
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
    
    // Dừng
    socket.on('stand', async (data) => {
        try {
            const { roomId, userId } = data;
            const room = await BlackjackRoom.findOne({ roomId });
            
            const playerIndex = room.players.findIndex(p => p.userId.toString() === userId);
            if (playerIndex === room.currentTurn) {
                room.players[playerIndex].stand = true;
                nextTurn(room);
                await room.save();
                io.to(roomId).emit('roomUpdate', room);
            }
        } catch (error) {
            socket.emit('error', error.message);
        }
    });
});

// Helper functions
function startGame(room) {
    room.deck = createDeck();
    room.dealerCards = [room.deck.pop(), room.deck.pop()];
    
    room.players.forEach(player => {
        player.cards = [room.deck.pop(), room.deck.pop()];
        player.stand = false;
    });
    
    room.status = 'playing';
    room.currentTurn = 0;
}

function nextTurn(room) {
    do {
        room.currentTurn++;
        if (room.currentTurn >= room.players.length) {
            dealerPlay(room);
            endGame(room);
            return;
        }
    } while (room.players[room.currentTurn].stand);
}

function dealerPlay(room) {
    while (calculateHandValue(room.dealerCards) < 17) {
        room.dealerCards.push(room.deck.pop());
    }
}

function endGame(room) {
    const dealerValue = calculateHandValue(room.dealerCards);
    
    room.players.forEach(async (player) => {
        const playerValue = calculateHandValue(player.cards);
        let winAmount = 0;
        
        if (playerValue <= 21) {
            if (dealerValue > 21 || playerValue > dealerValue) {
                winAmount = player.bet * 2;
            } else if (playerValue === dealerValue) {
                winAmount = player.bet;
            }
        }
        
        // Update user balance
        if (winAmount > 0) {
            await User.findByIdAndUpdate(player.userId, {
                $inc: { balance: winAmount }
            });
        }
    });
    
    room.status = 'finished';
}

const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 