const jwt = require('jsonwebtoken');
const { Users } = require('../db');

function userAuth(roleRequired) {
    return async function (req, res, next) {
        try {
            // Expect header: Authorization: Bearer <token>
            const header = req.header('Authorization');
            const token = header ? header.replace('Bearer ', '') : null;

            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ message: 'Invalid token payload' });
            }

            const user = await Users.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (!user.isActive) {
                return res.status(403).json({ message: 'Account is disabled' });
            }

            // Attach full user object (so req.user._id, req.user.role etc. available)
            req.user = user;

            // Role check rules:
            // - roleRequired === 'admin' → must be admin
            // - roleRequired === 'user' or undefined → any authenticated active user
            if (roleRequired === 'admin' && user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied. Admins only.' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
        }
    };
}

module.exports = { userAuth };
