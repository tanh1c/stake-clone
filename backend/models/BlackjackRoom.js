const mongoose = require('mongoose');

const blackjackRoomSchema = new mongoose.Schema({
    roomId: { type: String, unique: true },
    status: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
    players: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        cards: [String],
        bet: Number,
        ready: { type: Boolean, default: false },
        stand: { type: Boolean, default: false }
    }],
    dealerCards: [String],
    deck: [String],
    currentTurn: { type: Number, default: 0 },
    minBet: { type: Number, default: 1 },
    maxBet: { type: Number, default: 1000 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BlackjackRoom', blackjackRoomSchema); 