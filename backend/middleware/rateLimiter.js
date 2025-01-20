const rateLimit = require('express-rate-limit');

const whitelist = ['127.0.0.1', 'your-ip'];

// Rate limiter cơ bản sử dụng memory store
const basicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: (req) => {
        if(whitelist.includes(req.ip)) return 0; // Không giới hạn cho whitelist
        return 1000;
    },
    message: {
        error: 'Quá nhiều request, vui lòng thử lại sau.'
    },
    standardHeaders: true, // Trả về RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Rate limiter cho API authentication
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 20, // Tăng lên 20 lần thử đăng nhập
    message: {
        error: 'Quá nhiều lần thử đăng nhập thất bại, vui lòng thử lại sau.'
    }
});

// Rate limiter cho game actions
const gameLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 100, // Tăng lên 100 game actions mỗi phút
    message: {
        error: 'Bạn đang chơi quá nhanh, vui lòng chậm lại.'
    }
});

module.exports = {
    basicLimiter,
    authLimiter,
    gameLimiter
}; 