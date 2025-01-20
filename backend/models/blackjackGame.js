const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    suit: String,
    value: String,
    numericValue: Number
});

const playerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    socketId: String,
    username: String,
    cards: [cardSchema],
    bet: Number,
    score: Number,
    status: {
        type: String,
        enum: ['waiting', 'betting', 'playing', 'stand', 'bust', 'blackjack'],
        default: 'waiting'
    }
});

const gameSchema = new mongoose.Schema({
    roomId: String,
    status: {
        type: String,
        enum: ['waiting', 'betting', 'playing', 'finished'],
        default: 'waiting'
    },
    players: [playerSchema],
    dealer: {
        cards: [cardSchema],
        score: Number
    },
    deck: [cardSchema],
    currentTurn: String, // socketId of current player
    betTimeout: Date,
    turnTimeout: Date,
    messages: [{
        username: String,
        message: String,
        timestamp: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('BlackjackGame', gameSchema); 