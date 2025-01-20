const rateLimit = require('express-rate-limit');

// Rate limiter cơ bản sử dụng memory store
const basicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn 100 request mỗi IP trong 15 phút
    message: {
        error: 'Quá nhiều request, vui lòng thử lại sau.'
    }
});

// Rate limiter cho API authentication
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 5, // 5 lần thử đăng nhập thất bại
    message: {
        error: 'Quá nhiều lần thử đăng nhập thất bại, vui lòng thử lại sau.'
    }
});

// Rate limiter cho game actions
const gameLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    max: 30, // 30 game actions mỗi phút
    message: {
        error: 'Bạn đang chơi quá nhanh, vui lòng chậm lại.'
    }
});

module.exports = {
    basicLimiter,
    authLimiter,
    gameLimiter
}; 