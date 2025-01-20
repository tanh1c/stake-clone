const Game = require('../models/blackjackGame');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

class BlackjackMultiplayer {
    constructor(io) {
        this.io = io;
        this.rooms = new Map();
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('joinRoom', async (data) => {
                try {
                    const { token } = data;
                    const user = await this.authenticateUser(token);
                    if (!user) {
                        socket.emit('error', { message: 'Authentication failed' });
                        return;
                    }

                    const room = await this.findAvailableRoom();
                    await socket.join(room.roomId);

                    // Add player to game
                    room.players.push({
                        userId: user._id,
                        socketId: socket.id,
                        username: user.username,
                        cards: [],
                        bet: 0,
                        score: 0,
                        status: 'waiting'
                    });
                    await room.save();

                    socket.emit('roomJoined', {
                        roomId: room.roomId,
                        players: room.players
                    });

                    this.io.to(room.roomId).emit('playerJoined', {
                        username: user.username,
                        socketId: socket.id
                    });

                    if (room.players.length >= 2) {
                        await this.startBettingRound(room);
                    }
                } catch (error) {
                    console.error('Join room error:', error);
                    socket.emit('error', { message: 'Failed to join room' });
                }
            });

            socket.on('placeBet', async (data) => {
                try {
                    const { amount } = data;
                    const room = await this.findRoomBySocket(socket.id);
                    const player = room.players.find(p => p.socketId === socket.id);
                    const user = await User.findById(player.userId);

                    if (user.balance < amount) {
                        socket.emit('error', { message: 'Insufficient balance' });
                        return;
                    }

                    // Update player bet and balance
                    user.balance -= amount;
                    await user.save();
                    player.bet = amount;
                    player.status = 'betting';
                    await room.save();

                    this.io.to(room.roomId).emit('betPlaced', {
                        socketId: socket.id,
                        amount,
                        username: player.username
                    });

                    // Check if all players have bet
                    if (room.players.every(p => p.status === 'betting')) {
                        await this.startGame(room);
                    }
                } catch (error) {
                    console.error('Place bet error:', error);
                    socket.emit('error', { message: 'Failed to place bet' });
                }
            });

            socket.on('hit', async () => {
                try {
                    const room = await this.findRoomBySocket(socket.id);
                    if (room.currentTurn !== socket.id) {
                        socket.emit('error', { message: 'Not your turn' });
                        return;
                    }

                    const player = room.players.find(p => p.socketId === socket.id);
                    const card = this.drawCard(room.deck);
                    player.cards.push(card);
                    player.score = this.calculateScore(player.cards);

                    if (player.score > 21) {
                        player.status = 'bust';
                        await this.nextTurn(room);
                    }

                    await room.save();
                    this.io.to(room.roomId).emit('cardDealt', {
                        socketId: socket.id,
                        card,
                        score: player.score,
                        status: player.status
                    });
                } catch (error) {
                    console.error('Hit error:', error);
                    socket.emit('error', { message: 'Failed to hit' });
                }
            });

            socket.on('stand', async () => {
                try {
                    const room = await this.findRoomBySocket(socket.id);
                    const player = room.players.find(p => p.socketId === socket.id);
                    player.status = 'stand';
                    await this.nextTurn(room);
                    await room.save();

                    this.io.to(room.roomId).emit('playerStand', {
                        socketId: socket.id,
                        username: player.username
                    });
                } catch (error) {
                    console.error('Stand error:', error);
                    socket.emit('error', { message: 'Failed to stand' });
                }
            });

            socket.on('sendMessage', async (data) => {
                try {
                    const room = await this.findRoomBySocket(socket.id);
                    const player = room.players.find(p => p.socketId === socket.id);
                    
                    const message = {
                        username: player.username,
                        message: data.message,
                        timestamp: new Date()
                    };
                    
                    room.messages.push(message);
                    await room.save();

                    this.io.to(room.roomId).emit('newMessage', message);
                } catch (error) {
                    console.error('Chat error:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            socket.on('disconnect', async () => {
                try {
                    const room = await this.findRoomBySocket(socket.id);
                    if (room) {
                        const player = room.players.find(p => p.socketId === socket.id);
                        room.players = room.players.filter(p => p.socketId !== socket.id);
                        await room.save();

                        this.io.to(room.roomId).emit('playerLeft', {
                            socketId: socket.id,
                            username: player.username
                        });

                        if (room.players.length < 2) {
                            await this.endGame(room);
                        }
                    }
                } catch (error) {
                    console.error('Disconnect error:', error);
                }
            });
        });
    }

    // Game logic helpers
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];

        for (let suit of suits) {
            for (let value of values) {
                deck.push({
                    suit,
                    value,
                    numericValue: this.getCardValue(value)
                });
            }
        }

        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    getCardValue(value) {
        if (value === 'A') return 11;
        if (['K', 'Q', 'J'].includes(value)) return 10;
        return parseInt(value);
    }

    calculateScore(cards) {
        let score = 0;
        let aces = 0;

        for (let card of cards) {
            if (card.value === 'A') {
                aces++;
            }
            score += card.numericValue;
        }

        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }

        return score;
    }

    async startGame(room) {
        room.status = 'playing';
        room.deck = this.createDeck();
        
        // Deal initial cards
        for (let player of room.players) {
            player.cards = [this.drawCard(room.deck), this.drawCard(room.deck)];
            player.score = this.calculateScore(player.cards);
            player.status = 'playing';
        }

        room.dealer = {
            cards: [this.drawCard(room.deck)],
            score: 0
        };

        room.currentTurn = room.players[0].socketId;
        await room.save();

        this.io.to(room.roomId).emit('gameStarted', {
            players: room.players,
            dealer: room.dealer,
            currentTurn: room.currentTurn
        });
    }

    async nextTurn(room) {
        const currentIndex = room.players.findIndex(p => p.socketId === room.currentTurn);
        let nextIndex = currentIndex + 1;

        if (nextIndex >= room.players.length || room.players.every(p => ['stand', 'bust'].includes(p.status))) {
            await this.dealerTurn(room);
        } else {
            room.currentTurn = room.players[nextIndex].socketId;
            await room.save();
            this.io.to(room.roomId).emit('nextTurn', { currentTurn: room.currentTurn });
        }
    }

    async dealerTurn(room) {
        // Deal dealer's second card
        room.dealer.cards.push(this.drawCard(room.deck));
        room.dealer.score = this.calculateScore(room.dealer.cards);

        // Dealer must hit on 16 and below
        while (room.dealer.score < 17) {
            room.dealer.cards.push(this.drawCard(room.deck));
            room.dealer.score = this.calculateScore(room.dealer.cards);
        }

        await this.determineWinners(room);
    }

    async determineWinners(room) {
        const dealerScore = room.dealer.score;
        const dealerBust = dealerScore > 21;

        for (let player of room.players) {
            const playerScore = player.score;
            let winAmount = 0;

            if (player.status !== 'bust') {
                if (dealerBust || playerScore > dealerScore) {
                    winAmount = player.bet * 2;
                } else if (playerScore === dealerScore) {
                    winAmount = player.bet; // Push
                }
            }

            if (winAmount > 0) {
                const user = await User.findById(player.userId);
                user.balance += winAmount;
                await user.save();
            }

            this.io.to(room.roomId).emit('gameResult', {
                socketId: player.socketId,
                username: player.username,
                result: winAmount > player.bet ? 'win' : winAmount === player.bet ? 'push' : 'lose',
                winAmount
            });
        }

        room.status = 'finished';
        await room.save();

        // Start new round after delay
        setTimeout(async () => {
            await this.startBettingRound(room);
        }, 5000);
    }

    drawCard(deck) {
        return deck.pop();
    }

    // Helper methods
    async authenticateUser(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return await User.findById(decoded.userId);
        } catch (error) {
            return null;
        }
    }

    findAvailableRoom() {
        // Find room with space or create new one
    }

    startNewRound(room) {
        // Initialize new round
    }

    async handleBet(player, amount) {
        // Handle betting logic and balance updates
    }

    // Other helper methods
}

module.exports = BlackjackMultiplayer; 