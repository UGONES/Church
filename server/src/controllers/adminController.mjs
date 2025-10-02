// controllers/adminController.mjs
import AdminCode from '../models/AdminCode.mjs';
import User from '../models/User.mjs';
import Analytics from '../models/Analyitics.mjs'; // optional - ensure file exists or handle gracefully
import { validationResult } from 'express-validator';
import tokenUtils from '../utils/generateToken.mjs';

export async function generateAdminCode(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { description, role = 'admin', maxUsage = 1, expiresInDays = 30 } = req.body;
    const code = tokenUtils.generateAdminCode();

    const adminCode = new AdminCode({
      code,
      description,
      role,
      maxUsage,
      expiresAt: new Date(Date.now() + (Number(expiresInDays) || 30) * 24 * 60 * 60 * 1000),
      createdBy: req.user && req.user.id ? req.user.id : req.user._id
    });

    await adminCode.save();

    return res.status(201).json({ success: true, message: 'Admin code generated', code: adminCode.code });
  } catch (err) {
    console.error('Generate admin code error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getAdminCodes(req, res) {
  try {
    const { page = 1, limit = 20, used } = req.query;
    const query = {};
    if (used !== undefined) query.isUsed = used === 'true';
    const docs = await AdminCode.find(query).populate('createdBy', 'name email').populate('assignedTo', 'name email').sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await AdminCode.countDocuments(query);
    return res.json({ success: true, adminCodes: docs, total, totalPages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    console.error('Get admin codes error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getUsers(req, res) {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const q = {};
    if (role) q.role = role;
    if (search) q.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(q).select('-password -verificationToken -resetPasswordToken -adminCode').sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await User.countDocuments(q);
    return res.json({ success: true, users, total, totalPages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (err) {
    console.error('Get users error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });

    // Prevent self-demotion unless explicitly allowed
    if (req.user && req.user.id === userId && req.user.role === 'admin' && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot demote yourself' });
    }

    const updated = await User.findByIdAndUpdate(userId, { role }, { new: true }).select('-password -verificationToken -resetPasswordToken -adminCode');
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'Role updated', user: updated.getPublicProfile ? updated.getPublicProfile() : updated });
  } catch (err) {
    console.error('Update user role error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function deactivateUser(req, res) {
  try {
    const { userId } = req.params;
    if (req.user && req.user.id === userId) return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true }).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'User deactivated', user });
  } catch (err) {
    console.error('Deactivate user error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function activateUser(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true }).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'User activated', user });
  } catch (err) {
    console.error('Activate user error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalModerators = await User.countDocuments({ role: 'moderator' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

    // Analytics model may not exist; handle gracefully
    let recentActivity = [];
    try {
      recentActivity = await Analytics.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(10);
    } catch (e) {
      recentActivity = [];
    }

    return res.json({
      success: true,
      stats: { totalUsers, totalAdmins, totalModerators, activeUsers, newUsersThisWeek },
      recentActivity
    });
  } catch (err) {
    console.error('Get dashboard stats error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
