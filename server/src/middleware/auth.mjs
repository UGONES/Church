import jwt from 'jsonwebtoken';
const { verify } = jwt;
import User from '../models/User.mjs'; // FIXED: Import User, not findById
import Session from '../models/Session.mjs';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    
    // Check if session is still valid
    const session = await Session.findOne({ 
      token, 
      userId: decoded.userId, 
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session) {
      return res.status(401).json({ message: 'Session expired or invalid.' });
    }

    // FIXED: Use User.findById() instead of findById()
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive.' });
    }

    req.user = user;
    req.token = token;
    req.session = session;
    
    // Update session activity
    session.updateActivity();
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = verify(token, process.env.JWT_SECRET);
      // FIXED: Use User.findById() instead of findById()
      const user = await User.findById(decoded.userId).select('-password -__v');
      
      if (user && user.isActive) {
        req.user = user;
        
        // Update session activity if exists
        const session = await Session.findOne({ 
          token, 
          userId: decoded.userId, 
          isActive: true 
        });
        if (session) {
          session.updateActivity();
        }
      }
    }
    
    next();
  } catch (error) {
    next(); // Continue without authentication
  }
};

// At the end of the file:
export { auth, optionalAuth };