const { body, validationResult } = require('express-validator');

// Validate đầu vào
const validateInput = {
    login: [
        body('username').trim()
            .isLength({ min: 3, max: 30 })
            .matches(/^[a-zA-Z0-9_]+$/)
            .escape(),
        body('password').trim()
            .isLength({ min: 6 })
            .escape()
    ],
    
    register: [
        body('username').trim()
            .isLength({ min: 3, max: 30 })
            .matches(/^[a-zA-Z0-9_]+$/)
            .escape(),
        body('email').trim()
            .isEmail()
            .normalizeEmail()
            .escape(),
        body('password').trim()
            .isLength({ min: 6 })
            .escape()
    ],
    
    gameAction: [
        body('betAmount').trim()
            .isFloat({ min: 0.01 })
            .toFloat(),
        body('gameType').trim()
            .isIn(['dice', 'crash', 'mines', 'plinko', 'blackjack', 'hilo', 'double-dice', 'limbo', 'slot'])
            .escape()
    ]
};

// Middleware kiểm tra kết quả validate
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Invalid input',
            details: errors.array() 
        });
    }
    next();
};

module.exports = {
    validateInput,
    handleValidation
}; 