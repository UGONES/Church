import User from '../models/User.mjs';

// Get current user profile
export async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -verificationToken -resetPasswordToken -adminCode');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update user profile
export async function updateProfile(req, res) {
  try {
    const { 
      firstName, 
      lastName, 
      phone, 
      address, 
      communicationPreferences,
      volunteerProfile
    } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (communicationPreferences !== undefined) updateData.communicationPreferences = communicationPreferences;
    if (volunteerProfile !== undefined) updateData.volunteerProfile = volunteerProfile;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -verificationToken -resetPasswordToken -adminCode');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Add family member
export async function addFamilyMember(req, res) {
  try {
    const { name, relationship, age } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { familyMembers: { name, relationship, age } } },
      { new: true, runValidators: true }
    ).select('familyMembers');

    res.json({
      message: 'Family member added successfully',
      familyMembers: user.familyMembers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Remove family member
export async function removeFamilyMember(req, res) {
  try {
    const { memberId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { familyMembers: { _id: memberId } } },
      { new: true }
    ).select('familyMembers');

    res.json({
      message: 'Family member removed successfully',
      familyMembers: user.familyMembers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get user dashboard data
export async function getUserDashboard(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('name firstName lastName email role avatar memberSince membershipStatus smallGroup familyMembers volunteerStats');
    
    // In a real application, you would also fetch:
    // - Recent donations
    // - Upcoming events
    // - Volunteer applications
    // - etc.

    res.json({
      user,
      stats: {
        donationCount: 0, // Would come from donations service
        eventCount: 0,    // Would come from events service
        volunteerApplications: 0 // Would come from volunteer service
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get all users (Admin)
export async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 10, role, search, membershipStatus } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (membershipStatus) query.membershipStatus = membershipStatus;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken -adminCode')
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

// Create user (Admin)
export async function createUser(req, res) {
  try {
    const { name, email, password, role, phone, address, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({
      name: name || `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email,
      password,
      role: role || 'user',
      phone,
      address,
      emailVerified: true // Admin-created users are automatically verified
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update user (Admin)
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, phone, address, isActive, firstName, lastName, membershipStatus } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, firstName, lastName, email, role, phone, address, isActive, membershipStatus },
      { new: true, runValidators: true }
    ).select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete user (Admin)
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get user roles (Admin)
export async function getUserRoles(req, res) {
  try {
    const roles = await User.distinct('role');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get membership statuses (Admin)
export async function getMembershipStatuses(req, res) {
  try {
    const statuses = await User.distinct('membershipStatus');
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}