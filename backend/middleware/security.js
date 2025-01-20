const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Middleware xác thực JWT an toàn hơn
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error();
        }
        
        // Verify với các options bảo mật
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            ignoreExpiration: false
        });
        
        // Tìm user an toàn
        const user = await User.findOne({
            _id: { $eq: decoded.userId },
            'tokens.token': { $eq: token }
        });
        
        if (!user) {
            throw new Error();
        }
        
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Rate limiting cho game actions
const gameLimiter = rateLimit({
    windowMs: 1000, // 1 giây
    max: 5, // Tối đa 5 request/giây
    message: { error: 'Too many requests' }
});

// Security middleware
const securityMiddleware = [
    helmet(),
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.API_URL],
        }
    }),
    helmet.dnsPrefetchControl({ allow: false }),
    helmet.frameguard({ action: 'deny' }),
    helmet.hidePoweredBy(),
    helmet.hsts({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }),
    helmet.ieNoOpen(),
    helmet.noSniff(),
    helmet.permittedCrossDomainPolicies(),
    helmet.referrerPolicy({ policy: 'same-origin' }),
    helmet.xssFilter()
];

module.exports = {
    auth,
    gameLimiter,
    securityMiddleware
}; 