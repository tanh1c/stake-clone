const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting'
    },
    players: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        balance: Number,
        cards: [String],
        bet: Number,
        ready: Boolean,
        isDealer: Boolean
    }],
    deck: [String],
    currentTurn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    minBet: {
        type: Number,
        default: 1
    },
    maxBet: {
        type: Number,
        default: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Tự động xóa sau 1 giờ
    }
});

module.exports = mongoose.model('Room', roomSchema); 