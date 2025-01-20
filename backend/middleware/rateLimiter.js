const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Rate limiter cơ bản
const basicLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:basic:'
    }),
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn 100 request mỗi IP trong 15 phút
    message: {
        error: 'Quá nhiều request, vui lòng thử lại sau.'
    }
});

// Rate limiter cho API authentication
const authLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:auth:'
    }),
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 5, // 5 lần thử đăng nhập thất bại
    message: {
        error: 'Quá nhiều lần thử đăng nhập thất bại, vui lòng thử lại sau.'
    }
});

// Rate limiter cho game actions
const gameLimiter = rateLimit({
    store: new RedisStore({
        client: redis,
        prefix: 'rl:game:'
    }),
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