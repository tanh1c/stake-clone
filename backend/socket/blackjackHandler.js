const User = require('../models/User');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
    const rooms = new Map();

    // Middleware kiểm tra auth cho socket
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('No token provided'));
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            console.log('Socket auth success:', socket.userId);
            next();
        } catch (err) {
            console.error('Socket auth error:', err);
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                socket.connect();
            }
        });

        // Xử lý lấy danh sách phòng
        socket.on('getRoomList', async () => {
            try {
                const rooms = await getRoomList();
                socket.emit('roomList', rooms);
            } catch (error) {
                console.error('Get room list error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Tạo phòng mới
        socket.on('createRoom', async (data) => {
            try {
                const { minBet, maxBet } = data;
                const userId = socket.userId;
                
                console.log('Creating room:', data);
                
                const user = await User.findById(userId);
                
                if (!user) {
                    socket.emit('error', { message: 'User not found' });
                    return;
                }

                // Kiểm tra giá trị bet
                if (!minBet || !maxBet || minBet <= 0 || maxBet <= 0) {
                    socket.emit('error', { message: 'Invalid bet amounts' });
                    return;
                }

                const roomId = Math.random().toString(36).substring(7);
                const room = new Room({
                    roomId,
                    minBet,
                    maxBet,
                    players: [{
                        userId: user._id,
                        username: user.username,
                        balance: user.balance,
                        cards: [],
                        bet: 0,
                        ready: false,
                        isDealer: true
                    }]
                });

                await room.save();
                socket.join(roomId);
                rooms.set(roomId, { deck: createDeck() });
                
                console.log('Room created:', roomId);
                socket.emit('roomCreated', { roomId });
                io.emit('roomList', await getRoomList());
            } catch (error) {
                console.error('Create room error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Tham gia phòng
        socket.on('joinRoom', async (data) => {
            try {
                const { roomId, userId } = data;
                const room = await Room.findOne({ roomId });
                const user = await User.findById(userId);

                if (!room || !user) {
                    socket.emit('error', { message: 'Room or user not found' });
                    return;
                }

                if (room.players.length >= 7) {
                    socket.emit('error', { message: 'Room is full' });
                    return;
                }

                room.players.push({
                    userId: user._id,
                    username: user.username,
                    balance: user.balance,
                    cards: [],
                    bet: 0,
                    ready: false,
                    isDealer: false
                });

                await room.save();
                socket.join(roomId);
                
                io.to(roomId).emit('playerJoined', {
                    players: room.players
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Đặt cược
        socket.on('placeBet', async (data) => {
            try {
                const { roomId, userId, amount } = data;
                const room = await Room.findOne({ roomId });
                
                if (!room) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }

                const player = room.players.find(p => p.userId.toString() === userId);
                if (!player) {
                    socket.emit('error', { message: 'Player not found' });
                    return;
                }

                if (amount > player.balance) {
                    socket.emit('error', { message: 'Insufficient balance' });
                    return;
                }

                player.bet = amount;
                player.ready = true;
                await room.save();

                io.to(roomId).emit('betPlaced', {
                    userId,
                    amount,
                    players: room.players
                });

                // Kiểm tra nếu tất cả người chơi đã sẵn sàng
                if (room.players.every(p => p.ready)) {
                    startGame(room);
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Rút bài
        socket.on('hit', async (data) => {
            try {
                const { roomId, userId } = data;
                const room = await Room.findOne({ roomId });
                
                if (!room || room.currentTurn.toString() !== userId) {
                    socket.emit('error', { message: 'Not your turn' });
                    return;
                }

                const player = room.players.find(p => p.userId.toString() === userId);
                const card = drawCard(room.deck);
                player.cards.push(card);

                if (calculateScore(player.cards) > 21) {
                    nextTurn(room);
                }

                await room.save();
                io.to(roomId).emit('gameState', {
                    players: room.players,
                    currentTurn: room.currentTurn
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Dừng
        socket.on('stand', async (data) => {
            try {
                const { roomId, userId } = data;
                const room = await Room.findOne({ roomId });
                
                if (!room || room.currentTurn.toString() !== userId) {
                    socket.emit('error', { message: 'Not your turn' });
                    return;
                }

                nextTurn(room);
                await room.save();

                io.to(roomId).emit('gameState', {
                    players: room.players,
                    currentTurn: room.currentTurn
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Rời phòng
        socket.on('leaveRoom', async (data) => {
            try {
                const { roomId, userId } = data;
                const room = await Room.findOne({ roomId });
                
                if (!room) return;

                room.players = room.players.filter(p => p.userId.toString() !== userId);
                
                if (room.players.length === 0) {
                    await Room.deleteOne({ roomId });
                    rooms.delete(roomId);
                } else {
                    await room.save();
                }

                socket.leave(roomId);
                io.to(roomId).emit('playerLeft', {
                    userId,
                    players: room.players
                });
                io.emit('roomList', await getRoomList());
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Thêm xử lý chat
        socket.on('sendMessage', async (data) => {
            try {
                const { roomId, userId, message } = data;
                const user = await User.findById(userId);
                
                io.to(roomId).emit('newMessage', {
                    username: user.username,
                    message,
                    timestamp: new Date()
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', async () => {
            try {
                // Tìm phòng mà người chơi đang tham gia
                const room = await Room.findOne({
                    'players.userId': socket.userId
                });
                
                if (room) {
                    // Nếu là dealer, kết thúc game
                    const player = room.players.find(p => p.userId.toString() === socket.userId);
                    if (player.isDealer) {
                        endGame(room);
                    } else {
                        // Nếu không phải dealer, xóa người chơi khỏi phòng
                        room.players = room.players.filter(p => p.userId.toString() !== socket.userId);
                        await room.save();
                        
                        io.to(room.roomId).emit('playerLeft', {
                            userId: socket.userId,
                            players: room.players
                        });
                    }
                }
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        });

        socket.on('rejoinRoom', async (data) => {
            try {
                const { roomId, userId } = data;
                const room = await Room.findOne({ roomId });
                
                if (room && room.players.some(p => p.userId.toString() === userId)) {
                    socket.join(roomId);
                    socket.emit('gameState', {
                        players: room.players,
                        currentTurn: room.currentTurn
                    });
                }
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
    });

    // Helper functions
    function createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];

        for (let suit of suits) {
            for (let value of values) {
                deck.push(value + suit);
            }
        }

        return shuffle(deck);
    }

    function shuffle(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    function drawCard(deck) {
        return deck.pop();
    }

    function calculateScore(cards) {
        let score = 0;
        let aces = 0;

        for (let card of cards) {
            const value = card.slice(0, -1);
            if (value === 'A') {
                aces++;
                score += 11;
            } else if (['K', 'Q', 'J'].includes(value)) {
                score += 10;
            } else {
                score += parseInt(value);
            }
        }

        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }

        return score;
    }

    async function startGame(room) {
        room.status = 'playing';
        room.deck = createDeck();
        
        // Phát bài cho mỗi người chơi
        for (let player of room.players) {
            player.cards = [drawCard(room.deck), drawCard(room.deck)];
        }

        // Dealer là người chơi đầu tiên
        room.currentTurn = room.players.find(p => p.isDealer).userId;
        
        room.turnTimeout = new Date(Date.now() + 30000); // 30 seconds per turn
        await room.save();
        
        // Start turn timer
        startTurnTimer(room);

        io.to(room.roomId).emit('gameStarted', {
            players: room.players,
            currentTurn: room.currentTurn
        });
    }

    async function nextTurn(room) {
        const currentIndex = room.players.findIndex(p => p.userId.toString() === room.currentTurn.toString());
        const nextIndex = (currentIndex + 1) % room.players.length;
        room.currentTurn = room.players[nextIndex].userId;

        if (nextIndex === 0) { // Quay lại dealer
            endGame(room);
        }
    }

    async function endGame(room) {
        const dealer = room.players.find(p => p.isDealer);
        const dealerScore = calculateScore(dealer.cards);

        // Dealer phải rút bài nếu dưới 17 điểm
        while (dealerScore < 17) {
            dealer.cards.push(drawCard(room.deck));
        }

        // Tính toán kết quả
        for (let player of room.players) {
            if (player.isDealer) continue;

            const playerScore = calculateScore(player.cards);
            const playerBet = player.bet;

            if (playerScore > 21) {
                // Player bust - thua
                player.balance -= playerBet;
                dealer.balance += playerBet;
            } else if (dealerScore > 21 || playerScore > dealerScore) {
                // Player thắng
                player.balance += playerBet;
                dealer.balance -= playerBet;
            } else if (playerScore < dealerScore) {
                // Player thua
                player.balance -= playerBet;
                dealer.balance += playerBet;
            }
            // Nếu hòa thì không thay đổi balance
        }

        room.status = 'finished';
        await room.save();

        // Cập nhật balance trong database
        for (let player of room.players) {
            await User.findByIdAndUpdate(player.userId, {
                $set: { balance: player.balance }
            });
        }

        io.to(room.roomId).emit('gameEnded', {
            players: room.players
        });
    }

    async function getRoomList() {
        return await Room.find({ status: 'waiting' })
            .select('roomId players minBet maxBet')
            .lean();
    }

    async function startTurnTimer(room) {
        setTimeout(async () => {
            const currentRoom = await Room.findOne({ roomId: room.roomId });
            if (!currentRoom || currentRoom.status !== 'playing') return;
            
            const now = new Date();
            if (currentRoom.turnTimeout && now > currentRoom.turnTimeout) {
                // Auto-stand nếu hết thời gian
                const currentPlayer = currentRoom.players.find(
                    p => p.userId.toString() === currentRoom.currentTurn.toString()
                );
                
                if (currentPlayer) {
                    await nextTurn(currentRoom);
                    io.to(currentRoom.roomId).emit('gameState', {
                        players: currentRoom.players,
                        currentTurn: currentRoom.currentTurn
                    });
                }
            }
        }, 30000);
    }
}; 