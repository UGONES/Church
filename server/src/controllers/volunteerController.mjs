import Volunteer from "../models/Volunteer.mjs";
import Ministry from "../models/Ministry.mjs";
import User from "../models/User.mjs";

// Get all volunteers (Admin)
export async function getAllVolunteers(req, res) {
  try {
    const { page = 1, limit = 10, status, ministryId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (ministryId) query.ministryId = ministryId;

    const volunteers = await Volunteer.find(query)
      .populate("userId", "name email avatar")
      .populate("ministryId", "name description")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * parseInt(limit));

    const total = await Volunteer.countDocuments(query);

    res.json({
      volunteers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get volunteer by ID
export async function getVolunteerById(req, res) {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findById(id)
      .populate("userId", "name email avatar phone address")
      .populate("ministryId", "name description leaders");

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Update volunteer status (Admin)
export async function updateVolunteerStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, role, notes } = req.body;

    const volunteer = await Volunteer.findByIdAndUpdate(
      id,
      { status, role, ...(notes && { adminNotes: notes }) },
      { new: true, runValidators: true },
    )
      .populate("userId", "name email")
      .populate("ministryId", "name");

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    res.json({
      message: "Volunteer status updated successfully",
      volunteer,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get user's volunteer applications
export async function getUserVolunteerApplications(req, res) {
  try {
    const volunteers = await Volunteer.find({ userId: req.user._id })
      .populate("ministryId", "name description imageUrl")
      .sort({ createdAt: -1 });

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get ministry volunteers
export async function getMinistryVolunteers(req, res) {
  try {
    const { ministryId } = req.params;
    const { status } = req.query;

    const query = { ministryId };
    if (status) query.status = status;

    const volunteers = await Volunteer.find(query)
      .populate("userId", "name email avatar skills")
      .sort({ createdAt: -1 });

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get volunteer stats
export async function getVolunteerStats(req, res) {
  try {
    const totalVolunteers = await Volunteer.countDocuments();
    const activeVolunteers = await Volunteer.countDocuments({
      status: "active",
    });
    const pendingVolunteers = await Volunteer.countDocuments({
      status: "pending",
    });

    const ministryStats = await Volunteer.aggregate([
      {
        $lookup: {
          from: "ministries",
          localField: "ministryId",
          foreignField: "_id",
          as: "ministry",
        },
      },
      { $unwind: "$ministry" },
      {
        $group: {
          _id: "$ministry.name",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const statusStats = await Volunteer.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalVolunteers,
      activeVolunteers,
      pendingVolunteers,
      ministryStats,
      statusStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
