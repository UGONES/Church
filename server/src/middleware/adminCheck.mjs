export const adminCheck = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

export const moderatorCheck = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    return res.status(403).json({ 
      message: 'Access denied. Moderator or admin privileges required.' 
    });
  }
  next();
};

// export default { adminCheck, moderatorCheck };