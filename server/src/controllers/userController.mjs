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

/**
 * Helper: convert various stored itemType values to PascalCase model names.
 * Accepts already-correct PascalCase values and lower/other variants.
 */
function toPascalModelName(raw) {
  if (!raw) return raw;
  if (typeof raw !== "string") raw = String(raw);
  // Trim and normalize
  const trimmed = raw.trim();
  // Common mapping if user stored lowercase 'event' etc.
  const map = {
    event: "Event",
    events: "Event",
    sermon: "Sermon",
    sermons: "Sermon",
    post: "BlogPost",
    blogpost: "BlogPost",
    blog: "BlogPost",
    ministry: "Ministry",
    ministries: "Ministry",
    "BlogPost": "BlogPost",
    "Event": "Event",
    "Sermon": "Sermon",
    "Ministry": "Ministry"
  };

  const lower = trimmed.toLowerCase();
  if (map[lower]) return map[lower];

  // Fallback: Capitalize first letter (best-effort)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/* ================================
   Get current user profile
================================= */
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select("-password -verificationToken -resetPasswordToken -adminCode")
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Fetch favorites WITHOUT assuming stored itemType is valid casing.
    const rawFavorites = await Favorite.find({ user: userId });

    // Populate each favorite.itemId using the correct PascalCase model name.
    const favorites = { events: [], sermons: [], posts: [] };

    await Promise.all(rawFavorites.map(async (favDoc) => {
      const modelName = toPascalModelName(favDoc.itemType);
      try {
        // Use document.populate API to explicitly tell Mongoose which model to use.
        await favDoc.populate({
          path: "itemId",
          model: modelName,
          select: "title startTime endTime location imageUrl category author createdAt"
        });
      } catch (popErr) {
        // If populate fails, skip this favorite (log for debugging)
        console.warn(`Warning: failed to populate favorite ${favDoc._id} as ${modelName}:`, popErr && popErr.message);
      }

      const item = favDoc.itemId;
      if (!item) return;

      // Group by PascalCase model names (Event, Sermon, BlogPost)
      if (modelName === "Event") favorites.events.push(item);
      else if (modelName === "Sermon") favorites.sermons.push(item);
      else if (modelName === "BlogPost") favorites.posts.push(item);
      else {
        // fallback: try to categorize by detected category field or known props
        if (item.category && typeof item.category === "string" && item.category.toLowerCase().includes("sermon")) {
          favorites.sermons.push(item);
        } else {
          favorites.posts.push(item);
        }
      }
    }));

    // RSVPs - populate event reference (Event is the correct model name)
    const rsvps = await RSVP.find({ user: userId })
      .populate({ path: "eventId", select: "title startTime endTime location capacity registered imageUrl" })
      .sort({ createdAt: -1 })
      .lean();

    // donations, volunteers, prayers
    const donations = await Donation.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const volunteers = await Volunteer.find({ user: userId }).populate("ministry", "name").lean();
    const prayers = await Prayer.find({ user: userId }).sort({ createdAt: -1 }).lean();

    const familyMembers = user.familyMembers || [];

    return res.json({
      success: true,
      data: {
        user,
        favorites,
        rsvps,
        donations,
        volunteers,
        prayers,
        familyMembers,
      },
    });
  } catch (err) {
    console.error("❌ getCurrentUser error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

/* ==================================
get user full profile
=================================== */
export async function getFullProfile(req, res) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select("-password -verificationToken -resetPasswordToken -adminCode")
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Favorites using itemId/itemType
    const rawFavorites = await Favorite.find({ user: userId });

    const favsByType = { events: [], sermons: [], posts: [] };
    await Promise.all(rawFavorites.map(async (favDoc) => {
      const modelName = toPascalModelName(favDoc.itemType);
      try {
        await favDoc.populate({
          path: "itemId",
          model: modelName,
          select: "title startTime endTime location imageUrl category author createdAt"
        });
      } catch (popErr) {
        console.warn(`Warning: failed to populate favorite ${favDoc._id} as ${modelName}:`, popErr && popErr.message);
      }

      const item = favDoc.itemId || null;
      if (!item) return;
      if (modelName === "Event") favsByType.events.push(item);
      else if (modelName === "Sermon") favsByType.sermons.push(item);
      else if (modelName === "BlogPost") favsByType.posts.push(item);
      else {
        // fallback grouping
        if (item.category && String(item.category).toLowerCase().includes("sermon")) favsByType.sermons.push(item);
        else favsByType.posts.push(item);
      }
    }));

    // RSVPs
    const rsvps = await RSVP.find({ user: userId })
      .populate({ path: "eventId", select: "title startTime endTime location capacity registered imageUrl" })
      .sort({ createdAt: -1 })
      .lean();

    // donations, volunteers, prayers
    const donations = await Donation.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const volunteers = await Volunteer.find({ user: userId }).populate("ministry", "name").lean();
    const prayers = await Prayer.find({ user: userId }).sort({ createdAt: -1 }).lean();

    const familyMembers = user.familyMembers || [];

    return res.json({
      success: true,
      user,
      favorites: favsByType,
      rsvps,
      donations,
      volunteers,
      prayers,
      familyMembers
    });
  } catch (err) {
    console.error("❌ getFullProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

/* ================================
   Update user profile
================================= */
export async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const updateData = {};
    const allowed = [
      "firstName", "lastName", "phone", "address",
      "communicationPreferences", "volunteerProfile", "avatar", "coverPhoto", "smallGroup", "membershipStatus"
    ];

    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updateData[k] = req.body[k];
    });

    // If name parts provided, ensure `name` is set
    if ((updateData.firstName || updateData.lastName) && !updateData.name) {
      updateData.name = `${updateData.firstName || ""} ${updateData.lastName || ""}`.trim();
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -verificationToken -resetPasswordToken -adminCode");

    return res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    console.error("❌ updateProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   Upload Avatar
================================ */
export async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "church/avatars",
      width: 400,
      height: 400,
      crop: "fill",
      gravity: "face",
    });

    // Update user -> avatar field (schema uses avatar)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: upload.secure_url },
      { new: true }
    ).select("-password -verificationToken -resetPasswordToken -adminCode");

    // remove temp file safely
    try {
      if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    } catch (fsErr) {
      console.warn("Warning: failed to remove temp upload file:", fsErr && fsErr.message);
    }

    return res.json({ success: true, message: "Avatar updated successfully", user });
  } catch (error) {
    console.error("❌ Avatar upload error:", error);
    // Attempt to cleanup local file if exists
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (_) { /* ignore */ }
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   Upload Cover Photo
================================ */
export async function uploadCoverPhoto(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

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
    ).select("-password -verificationToken -resetPasswordToken -adminCode");

    try {
      if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    } catch (fsErr) {
      console.warn("Warning: failed to remove temp upload file:", fsErr && fsErr.message);
    }

    return res.json({ success: true, message: "Cover photo updated successfully", user });
  } catch (error) {
    console.error("❌ Cover upload error:", error);
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (_) { /* ignore */ }

    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/*===============================
  Get family member
=================================*/
export const getFamily = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("familyMembers");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, familyMembers: user.familyMembers || [] });
  } catch (err) {
    console.error("❌ Family fetch error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

/* ================================
   Add family member
================================= */
export async function addFamilyMember(req, res) {
  try {
    const userId = req.user._id;
    const { name, relationship, age } = req.body;

    if (!name || !relationship) {
      return res.status(400).json({ success: false, message: "Name and relationship are required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { familyMembers: { name, relationship, age } } },
      { new: true, runValidators: true }
    ).select("familyMembers");

    return res.json({ success: true, message: "Family member added", familyMembers: user.familyMembers });
  } catch (error) {
    console.error("❌ addFamilyMember error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   Remove family member
================================= */
export async function removeFamilyMember(req, res) {
  try {
    const userId = req.user._id;
    const { memberId } = req.params;

    if (!memberId) return res.status(400).json({ success: false, message: "memberId required" });

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { familyMembers: { _id: memberId } } },
      { new: true }
    ).select("familyMembers");

    return res.json({ success: true, message: "Family member removed", familyMembers: user.familyMembers });
  } catch (error) {
    console.error("❌ removeFamilyMember error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
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

    return res.json({
      success: true,
      user,
      stats: {
        donationCount,
        eventCount: rsvpCount,
        volunteerApplications: volunteerCount
      }
    });
  } catch (error) {
    console.error("❌ getUserDashboard error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   Track login activity (atomic)
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
    console.error("❌ trackLoginActivity error:", error);
    throw new Error('Error tracking login activity: ' + error.message);
  }
}

/* ================================
   User RSVPs
================================= */
export async function getUserRSVPs(req, res) {
  try {
    const userId = req.user._id;
    const rsvps = await RSVP.find({ user: userId })
      .populate({ path: "eventId", select: "title startTime endTime location capacity registered imageUrl" })
      .sort({ createdAt: -1 }).lean();

    return res.json({ success: true, rsvps });
  } catch (error) {
    console.error("❌ getUserRSVPs error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   User Favorites
================================= */
export async function getUserFavorites(req, res) {
  try {
    const userId = req.user._id;
    const rawFavorites = await Favorite.find({ user: userId });

    const favsByType = { events: [], sermons: [], posts: [] };

    await Promise.all(rawFavorites.map(async (favDoc) => {
      const modelName = toPascalModelName(favDoc.itemType);
      try {
        await favDoc.populate({
          path: "itemId",
          model: modelName,
          select: "title startTime endTime location imageUrl category author createdAt"
        });
      } catch (popErr) {
        console.warn(`Warning: failed to populate favorite ${favDoc._id} as ${modelName}:`, popErr && popErr.message);
      }
      const item = favDoc.itemId;
      if (!item) return;
      if (modelName === "Event") favsByType.events.push(item);
      else if (modelName === "Sermon") favsByType.sermons.push(item);
      else if (modelName === "BlogPost") favsByType.posts.push(item);
      else favsByType.posts.push(item);
    }));

    return res.json({ success: true, favorites: favsByType });
  } catch (error) {
    console.error("❌ getUserFavorites error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   User Donations
================================= */
export async function getUserDonations(req, res) {
  try {
    const donations = await Donation.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, donations });
  } catch (error) {
    console.error("❌ getUserDonations error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   User Volunteer Applications
================================= */
export async function getUserVolunteers(req, res) {
  try {
    const volunteers = await Volunteer.find({ user: req.user._id }).populate("ministry", "name").lean();
    return res.json({ success: true, volunteers });
  } catch (error) {
    console.error("❌ getUserVolunteers error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   User Prayers
================================= */
export async function getUserPrayers(req, res) {
  try {
    const prayers = await Prayer.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, prayers });
  } catch (error) {
    console.error("❌ getUserPrayers error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

/* ================================
   Moderator Functions
================================= */
export async function getPendingVolunteers(req, res) {
  try {
    const volunteers = await Volunteer.find({ status: "pending" }).populate("user ministry");
    return res.json({ success: true, volunteers });
  } catch (error) {
    console.error("❌ getPendingVolunteers error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

export async function moderatePrayer(req, res) {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const prayer = await Prayer.findByIdAndUpdate(id, { approved }, { new: true });
    if (!prayer) return res.status(404).json({ success: false, message: "Prayer not found" });
    return res.json({ success: true, message: "Prayer updated", prayer });
  } catch (error) {
    console.error("❌ moderatePrayer error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

export async function moderateBlog(req, res) {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const blog = await BlogPost.findByIdAndUpdate(id, { approved }, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    return res.json({ success: true, message: "Blog updated", blog });
  } catch (error) {
    console.error("❌ moderateBlog error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
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
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    return res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error("❌ getAllUsers error:", error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role, phone, address, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = new User({
      name: name || `${firstName || ""} ${lastName || ""}`.trim(),
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

    return res.status(201).json({
      success: true,
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
    console.error("❌ createUser error:", error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    console.error("❌ updateUser error:", error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error("❌ deleteUser error:", error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function getUserRoles(req, res) {
  try {
    const roles = await User.distinct('role');
    return res.json({ success: true, roles });
  } catch (error) {
    console.error("❌ getUserRoles error:", error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function getMembershipStatuses(req, res) {
  try {
    const statuses = await User.distinct('membershipStatus');
    return res.json({ success: true, statuses });
  } catch (error) {
    console.error("❌ getMembershipStatuses error:", error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}
