import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cache from '../config/cache.js';

dotenv.config();

const authenticateToken = (req, res, next) => {
  let token = req.cookies.access_token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id, email, role
    cache.set(`user:online:${decoded.id}`, Date.now(), 120).catch(() => {}); // 2 min TTL
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

const optionalAuthenticateToken = (req, res, next) => {
  let token = req.cookies?.access_token;
  
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      cache.set(`user:online:${decoded.id}`, Date.now(), 120).catch(() => {});
    } catch (error) {
      // Ignore token verification errors for optional authentication
    }
  }
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to perform this action.'
      });
    }
    next();
  };
};

export { authenticateToken, optionalAuthenticateToken, authorizeRoles };
