const jwt = require('jsonwebtoken');

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

module.exports = { auth }; 