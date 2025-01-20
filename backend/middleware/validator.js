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

const gameValidation = [
    body('data').custom((value, { req }) => {
        try {
            // Decrypt data
            const decrypted = decrypt(value);
            
            // Validate timestamp để tránh replay attacks
            const timestamp = decrypted.timestamp;
            if (Date.now() - timestamp > 5000) { // 5 giây
                throw new Error('Request expired');
            }
            
            // Validate game data
            if (!isValidGameData(decrypted.gameType, decrypted.gameData)) {
                throw new Error('Invalid game data');
            }
            
            // Attach decrypted data to request
            req.gameData = decrypted;
            return true;
        } catch (error) {
            throw new Error('Invalid request data');
        }
    })
];

function isValidGameData(gameType, data) {
    switch(gameType) {
        case 'dice':
            return data.target >= 1 && data.target <= 95;
        case 'crash':
            return data.cashoutAt >= 1.01;
        // Thêm validation cho các game khác
        default:
            return false;
    }
}

module.exports = {
    validateInput,
    handleValidation,
    gameValidation
}; 