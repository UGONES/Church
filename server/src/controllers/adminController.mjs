import User from '../models/User.mjs';
import AdminCode from '../models/AdminCode.mjs';
import Analytics from '../models/Analyitics.mjs';
import { validationResult } from 'express-validator';

// Generate admin code
export async function generateAdminCode(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { description, role = 'admin', maxUsage = 1, expiresInDays = 30 } = req.body;

        const adminCode = new AdminCode({
            description,
            role,
            maxUsage,
            expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
            createdBy: req.user._id
        });

        await adminCode.save();

        res.status(201).json({
            message: 'Admin code generated successfully',
            code: adminCode.code
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get all admin codes
export async function getAdminCodes(req, res) {
    try {
        const { page = 1, limit = 10, used } = req.query;

        const query = {};
        if (used !== undefined) {
            query.isUsed = used === 'true';
        }

        const adminCodes = await AdminCode.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AdminCode.countDocuments(query);

        res.json({
            adminCodes,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get all users
export async function getUsers(req, res) {
    try {
        const { page = 1, limit = 10, role, search } = req.query;

        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password -verificationToken -resetPasswordToken')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Update user role
export async function updateUserRole(req, res) {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'moderator', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Prevent self-demotion
        if (userId === req.user._id.toString() && role !== 'admin') {
            return res.status(400).json({ message: 'Cannot change your own role from admin' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password -verificationToken -resetPasswordToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User role updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Deactivate user
export async function deactivateUser(req, res) {
    try {
        const { userId } = req.params;

        // Prevent self-deactivation
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        ).select('-password -verificationToken -resetPasswordToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deactivated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Activate user
export async function activateUser(req, res) {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: true },
            { new: true }
        ).select('-password -verificationToken -resetPasswordToken');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User activated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Get dashboard statistics
export async function getDashboardStats(req, res) {
    try {
        const [
            totalUsers,
            totalAdmins,
            totalModerators,
            activeUsers,
            newUsersThisWeek,
            totalDonations,
            totalPrayerRequests,
            totalTestimonials
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'moderator' }),
            User.countDocuments({ isActive: true }),
            User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }),
            // Add counts for other models as needed
            Promise.resolve(0), // Placeholder for donations
            Promise.resolve(0), // Placeholder for prayer requests
            Promise.resolve(0)  // Placeholder for testimonials
        ]);

        // Get recent activity
        const recentActivity = await Analytics.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            stats: {
                totalUsers,
                totalAdmins,
                totalModerators,
                activeUsers,
                newUsersThisWeek,
                totalDonations,
                totalPrayerRequests,
                totalTestimonials
            },
            recentActivity
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
