const mongoose = require('mongoose');

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

module.exports = mongoose.model('User', userSchema); 