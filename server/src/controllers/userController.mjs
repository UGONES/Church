import cloudinary from "../config/cloudinary.mjs";
import fs from "fs";

import User from "../models/User.mjs";
import Donation from "../models/Donation.mjs";
import Event from "../models/Event.mjs";
import RSVP from "../models/RSVP.mjs";
import Favorite from "../models/Favorite.mjs";
import Volunteer from "../models/Volunteer.mjs";
import Prayer from "../models/Prayer.mjs";
import BlogPost from "../models/BlogPost.mjs";



/* ================================
   Get current user profile
================================= */
export async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -verificationToken -resetPasswordToken -adminCode");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   Update user profile
================================= */
export async function updateProfile(req, res) {
  try {
    const updateData = {};
    const fields = [
      "firstName", "lastName", "phone", "address",
      "communicationPreferences", "volunteerProfile", "avatar"
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true
    }).select("-password -verificationToken -resetPasswordToken -adminCode");

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


/*===============================
  Get family member
=================================*/
export const getFamily =  async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ familyMembers: user.familyMembers || [] });
  } catch (err) {
    console.error("❌ Family fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/* ================================
   Add family member
================================= */
export async function addFamilyMember(req, res) {
  try {
    const { name, relationship, age } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { familyMembers: { name, relationship, age } } },
      { new: true, runValidators: true }
    ).select("familyMembers");

    res.json({ message: "Family member added", familyMembers: user.familyMembers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   Remove family member
================================= */
export async function removeFamilyMember(req, res) {
  try {
    const { memberId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { familyMembers: { _id: memberId } } },
      { new: true }
    ).select("familyMembers");

    res.json({ message: "Family member removed", familyMembers: user.familyMembers });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   Get user dashboard data
================================= */
export async function getUserDashboard(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("name firstName lastName email role avatar memberSince membershipStatus smallGroup familyMembers volunteerStats");

    const donationCount = await Donation.countDocuments({ user: req.user._id });
    const rsvpCount = await RSVP.countDocuments({ user: req.user._id });
    const volunteerCount = await Volunteer.countDocuments({ user: req.user._id });

    res.json({
      user,
      stats: {
        donationCount,
        eventCount: rsvpCount,
        volunteerApplications: volunteerCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   Track login activity (Fix VersionError)
================================= */
export async function trackLoginActivity(userId) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { lastLogin: new Date() },
        $inc: { loginCount: 1 }
      },
      { new: true }
    ).select('-password -verificationToken -resetPasswordToken -adminCode');

    return updatedUser;
  } catch (error) {
    throw new Error('Error tracking login activity: ' + error.message);
  }
}

/* ================================
   User RSVPs
================================= */
export async function getUserRSVPs(req, res) {
  try {
    const rsvps = await RSVP.find({ user: req.user._id }).populate("event", "title date location");
    res.json(rsvps);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   User Favorites
================================= */
export async function getUserFavorites(req, res) {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate("event", "title date location");
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   User Donations
================================= */
export async function getUserDonations(req, res) {
  try {
    const donations = await Donation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   User Volunteer Applications
================================= */
export async function getUserVolunteers(req, res) {
  try {
    const volunteers = await Volunteer.find({ user: req.user._id }).populate("ministry", "name");
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   User Prayers
================================= */
export async function getUserPrayers(req, res) {
  try {
    const prayers = await Prayer.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(prayers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   Moderator Functions
================================= */
export async function getPendingVolunteers(req, res) {
  try {
    const volunteers = await Volunteer.find({ status: "pending" }).populate("user ministry");
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function moderatePrayer(req, res) {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const prayer = await Prayer.findByIdAndUpdate(id, { approved }, { new: true });
    if (!prayer) return res.status(404).json({ message: "Prayer not found" });
    res.json({ message: "Prayer updated", prayer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function moderateBlog(req, res) {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const blog = await BlogPost.findByIdAndUpdate(id, { approved }, { new: true });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Blog updated", blog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   Admin Functions
================================= */
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

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

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

export async function getUserRoles(req, res) {
  try {
    const roles = await User.distinct('role');
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getMembershipStatuses(req, res) {
  try {
    const statuses = await User.distinct('membershipStatus');
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

/* ================================
   Upload Avatar
================================ */
export async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "church/avatars",
      width: 400,
      height: 400,
      crop: "fill",
      gravity: "face",
    });

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { photoUrl: upload.secure_url },
      { new: true }
    ).select("-password -verificationToken -resetPasswordToken");

    fs.unlinkSync(req.file.path); // clean temp file

    res.json({ message: "Avatar updated successfully", user });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/* ================================
   Upload Cover Photo
================================ */
export async function uploadCoverPhoto(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "church/covers",
      width: 1200,
      height: 400,
      crop: "fill",
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { coverPhoto: upload.secure_url },
      { new: true }
    ).select("-password -verificationToken -resetPasswordToken");

    fs.unlinkSync(req.file.path);
    res.json({ message: "Cover photo updated successfully", user });
  } catch (error) {
    console.error("Cover upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
