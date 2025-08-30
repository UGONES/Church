const AdminCode = require('../models/AdminCode');

const validateAdminCode = async (code) => {
  try {
    const adminCode = await AdminCode.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ],
      $or: [
        { maxUsage: null },
        { usageCount: { $lt: '$maxUsage' } }
      ]
    });

    if (!adminCode) {
      return false;
    }

    // Increment usage count
    adminCode.usageCount += 1;
    await adminCode.save();

    return true;
  } catch (error) {
    console.error('Admin code validation error:', error);
    return false;
  }
};