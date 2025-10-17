// ministryController.mjs
import Ministry from "../models/Ministry.mjs";
import Volunteer from "../models/Volunteer.mjs";
import User from "../models/User.mjs";

// Validation helper
const validatePagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  return { page: pageNum, limit: limitNum };
};

// Get all ministries with advanced filtering
export async function getAllMinistries(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const { page: pageNum, limit: limitNum } = validatePagination(page, limit);

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.tags = { $in: [category] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const ministries = await Ministry.find(query)
      .populate("leaders.user", "name email avatar")
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await Ministry.countDocuments(query);

    res.json({
      success: true,
      data: ministries,
      pagination: {
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Get ministries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ministries",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Get single ministry by ID
export async function getMinistryById(req, res) {
  try {
    const { id } = req.params;

    const ministry = await Ministry.findById(id)
      .populate("leaders.user", "name email avatar phone")
      .lean();

    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: "Ministry not found",
      });
    }

    res.json({
      success: true,
      data: ministry,
    });
  } catch (error) {
    console.error("Get ministry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ministry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Get volunteer opportunities with filtering
export async function getVolunteerOpportunities(req, res) {
  try {
    const { category, search } = req.query;

    const query = {
      status: "active",
      "volunteerNeeds.isActive": true,
    };

    if (category) query.tags = { $in: [category] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "volunteerNeeds.role": { $regex: search, $options: "i" } },
      ];
    }

    const ministries = await Ministry.find(query)
      .select(
        "name description imageUrl volunteerNeeds tags meetingSchedule meetingLocation",
      )
      .populate("leaders.user", "name email")
      .sort({ name: 1 })
      .lean();

    // Filter volunteer needs to only include active ones
    const ministriesWithActiveNeeds = ministries
      .map((ministry) => ({
        ...ministry,
        volunteerNeeds: ministry.volunteerNeeds.filter((need) => need.isActive),
      }))
      .filter((ministry) => ministry.volunteerNeeds.length > 0);

    res.json({
      success: true,
      data: ministriesWithActiveNeeds,
    });
  } catch (error) {
    console.error("Get volunteer opportunities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch volunteer opportunities",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Get user's ministries and volunteer roles
export async function getUserMinistries(req, res) {
  try {
    const volunteerRoles = await Volunteer.find({ userId: req.user._id })
      .populate("ministryId", "name description imageUrl status leaders")
      .select("ministryId role status appliedAt")
      .sort({ appliedAt: -1 })
      .lean();

    // Get ministries where user is a leader
    const leadingMinistries = await Ministry.find({
      "leaders.user": req.user._id,
    })
      .select("name description imageUrl status leaders")
      .lean();

    const leadingRoles = leadingMinistries.map((ministry) => {
      const leaderRole = ministry.leaders.find(
        (leader) => leader.user.toString() === req.user._id.toString(),
      );
      return {
        ministryId: ministry,
        role: leaderRole?.role || "Leader",
        status: "active",
        isLeader: true,
        appliedAt: null,
      };
    });

    const allRoles = [...volunteerRoles, ...leadingRoles];

    res.json({
      success: true,
      data: allRoles,
    });
  } catch (error) {
    console.error("Get user ministries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user ministries",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Volunteer for ministry
export async function volunteerForMinistry(req, res) {
  try {
    const { id } = req.params;
    const { role, interests, availability, skills, experience, message } =
      req.body;

    // Validate ministry exists and is active
    const ministry = await Ministry.findOne({
      _id: id,
      status: "active",
      "volunteerNeeds.isActive": true,
    });

    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: "Ministry not found or not accepting volunteers",
      });
    }

    // Check if volunteer role exists
    if (
      role &&
      !ministry.volunteerNeeds.some(
        (need) => need.role === role && need.isActive,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Requested volunteer role is not available",
      });
    }

    // Check for existing application
    const existingVolunteer = await Volunteer.findOne({
      userId: req.user._id,
      ministryId: id,
      status: { $in: ["pending", "approved"] },
    });

    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message:
          "You already have an active or pending application for this ministry",
      });
    }

    const volunteer = new Volunteer({
      userId: req.user._id,
      ministryId: id,
      role: role || "General Volunteer",
      interests,
      availability,
      skills,
      experience,
      message,
      status: "pending",
      appliedAt: new Date(),
    });

    await volunteer.save();
    await volunteer.populate("ministryId", "name description");

    res.status(201).json({
      success: true,
      message: "Volunteer application submitted successfully",
      data: volunteer,
    });
  } catch (error) {
    console.error("Volunteer application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit volunteer application",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Contact ministry leaders
export async function contactMinistryLeaders(req, res) {
  try {
    const { id } = req.params;
    const { subject, message, userEmail, userName } = req.body;

    const ministry = await Ministry.findById(id)
      .populate("leaders.user", "email name")
      .select("name leaders contactEmail");

    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: "Ministry not found",
      });
    }

    if (!ministry.leaders || ministry.leaders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No leaders found for this ministry",
      });
    }

    // In a real application, implement email sending logic here
    const leaderEmails = ministry.leaders.map((leader) => ({
      email: leader.user.email,
      name: leader.user.name,
    }));

    // For now, return success with email details
    res.json({
      success: true,
      message: "Message sent to ministry leaders successfully",
      data: {
        recipients: leaderEmails,
        subject,
        message,
        from: { email: userEmail, name: userName },
        ministry: ministry.name,
      },
    });
  } catch (error) {
    console.error("Contact leaders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message to leaders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Create ministry (Admin/Leader)
export async function createMinistry(req, res) {
  try {
    const ministryData = {
      ...req.body,
      // Parse array fields if they come as strings
      tags:
        typeof req.body.tags === "string"
          ? JSON.parse(req.body.tags)
          : req.body.tags,
      programs:
        typeof req.body.programs === "string"
          ? JSON.parse(req.body.programs)
          : req.body.programs,
      volunteerNeeds:
        typeof req.body.volunteerNeeds === "string"
          ? JSON.parse(req.body.volunteerNeeds)
          : req.body.volunteerNeeds,
      leaders:
        typeof req.body.leaders === "string"
          ? JSON.parse(req.body.leaders)
          : req.body.leaders,
    };

    if (req.file) {
      ministryData.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Add current user as primary leader if no leaders specified
    if (!ministryData.leaders || ministryData.leaders.length === 0) {
      ministryData.leaders = [
        {
          user: req.user._id,
          role: "Primary Leader",
          isPrimary: true,
        },
      ];
    }

    const ministry = new Ministry(ministryData);
    await ministry.save();
    await ministry.populate("leaders.user", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Ministry created successfully",
      data: ministry,
    });
  } catch (error) {
    console.error("Create ministry error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create ministry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Update ministry (Admin/Leader)
export async function updateMinistry(req, res) {
  try {
    const { id } = req.params;
    const ministryData = {
      ...req.body,
      // Parse array fields if they come as strings
      tags:
        typeof req.body.tags === "string"
          ? JSON.parse(req.body.tags)
          : req.body.tags,
      programs:
        typeof req.body.programs === "string"
          ? JSON.parse(req.body.programs)
          : req.body.programs,
      volunteerNeeds:
        typeof req.body.volunteerNeeds === "string"
          ? JSON.parse(req.body.volunteerNeeds)
          : req.body.volunteerNeeds,
      leaders:
        typeof req.body.leaders === "string"
          ? JSON.parse(req.body.leaders)
          : req.body.leaders,
    };

    if (req.file) {
      ministryData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const ministry = await Ministry.findByIdAndUpdate(id, ministryData, {
      new: true,
      runValidators: true,
    }).populate("leaders.user", "name email avatar");

    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: "Ministry not found",
      });
    }

    res.json({
      success: true,
      message: "Ministry updated successfully",
      data: ministry,
    });
  } catch (error) {
    console.error("Update ministry error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update ministry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Delete ministry (Admin)
export async function deleteMinistry(req, res) {
  try {
    const { id } = req.params;

    const ministry = await Ministry.findByIdAndDelete(id);

    if (!ministry) {
      return res.status(404).json({
        success: false,
        message: "Ministry not found",
      });
    }

    // Delete related volunteers
    await Volunteer.deleteMany({ ministryId: id });

    res.json({
      success: true,
      message: "Ministry deleted successfully",
    });
  } catch (error) {
    console.error("Delete ministry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ministry",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Get ministry stats (Admin)
export async function getMinistryStats(req, res) {
  try {
    const [
      totalMinistries,
      activeMinistries,
      totalVolunteers,
      pendingVolunteers,
      ministryStats,
      volunteerStats,
    ] = await Promise.all([
      Ministry.countDocuments(),
      Ministry.countDocuments({ status: "active" }),
      Volunteer.countDocuments(),
      Volunteer.countDocuments({ status: "pending" }),
      Ministry.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Volunteer.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Get ministries with most volunteers
    const popularMinistries = await Volunteer.aggregate([
      {
        $group: {
          _id: "$ministryId",
          volunteerCount: { $sum: 1 },
        },
      },
      {
        $sort: { volunteerCount: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "ministries",
          localField: "_id",
          foreignField: "_id",
          as: "ministry",
        },
      },
      {
        $unwind: "$ministry",
      },
      {
        $project: {
          name: "$ministry.name",
          volunteerCount: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalMinistries,
        activeMinistries,
        totalVolunteers,
        pendingVolunteers,
        statusDistribution: ministryStats,
        volunteerStatusDistribution: volunteerStats,
        popularMinistries,
      },
    });
  } catch (error) {
    console.error("Get ministry stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ministry statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Get ministry volunteers (Admin/Leader)
export async function getMinistryVolunteers(req, res) {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const { page: pageNum, limit: limitNum } = validatePagination(page, limit);

    const query = { ministryId: id };
    if (status) query.status = status;

    const volunteers = await Volunteer.find(query)
      .populate("userId", "name email avatar phone")
      .sort({ appliedAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await Volunteer.countDocuments(query);

    res.json({
      success: true,
      data: volunteers,
      pagination: {
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Get ministry volunteers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ministry volunteers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Get ministry categories
// Get ministry categories - FIXED VERSION
export async function getMinistryCategories(req, res) {
  try {
    console.log("📥 Fetching ministry categories...");

    // Use distinct with proper filtering
    const categories = await Ministry.distinct("tags", {
      tags: {
        $exists: true,
        $ne: null,
        $not: { $size: 0 },
      },
    }).catch((distinctError) => {
      console.warn(
        "⚠️ Distinct query failed, using alternative method:",
        distinctError,
      );
      return [];
    });

    console.log("📊 Raw categories from DB:", categories);

    // Handle cases where distinct returns null or invalid data
    let filteredCategories = [];

    if (categories && Array.isArray(categories)) {
      filteredCategories = categories
        .filter((cat) => {
          // Filter out null, undefined, empty strings, and non-string values
          if (cat == null) return false;
          if (typeof cat === "string") return cat.trim().length > 0;
          if (typeof cat === "object" && cat.name) {
            return cat.name.trim().length > 0;
          }
          return false;
        })
        .map((cat) => {
          // Normalize to strings
          if (typeof cat === "string") return cat.trim();
          if (typeof cat === "object" && cat.name) return cat.name.trim();
          return String(cat).trim();
        })
        .sort((a, b) => a.localeCompare(b));
    }

    console.log(
      `✅ Found ${filteredCategories.length} categories:`,
      filteredCategories,
    );

    // If no categories found, provide some defaults
    if (filteredCategories.length === 0) {
      console.log("📝 No categories found, using defaults");
      filteredCategories = [
        "Worship",
        "Outreach",
        "Youth",
        "Children",
        "Prayer",
        "Missions",
        "Men",
        "Women",
        "Seniors",
        "Music",
        "Media",
      ];
    }

    res.json({
      success: true,
      data: filteredCategories,
      count: filteredCategories.length,
      message:
        filteredCategories.length === 0
          ? "Using default categories"
          : "Categories loaded successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching ministry categories:", error);

    // Provide safe fallback response
    const defaultCategories = [
      "Worship",
      "Outreach",
      "Youth",
      "Children",
      "Prayer",
      "Missions",
    ];

    res.status(500).json({
      success: false,
      message: "Failed to fetch ministry categories. Using defaults.",
      data: defaultCategories,
      count: defaultCategories.length,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Add ministry category - FIXED VERSION
export async function addMinistryCategory(req, res) {
  try {
    const { name, category } = req.body;

    // Support both 'name' and 'category' fields for backward compatibility
    const categoryName = (name || category || "").trim();

    if (!categoryName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    console.log(`🔄 Adding category: ${categoryName}`);

    // Check if category already exists (case insensitive)
    const existingMinistry = await Ministry.findOne({
      tags: {
        $regex: new RegExp(`^${categoryName}$`, "i"),
      },
    });

    if (existingMinistry) {
      return res.status(400).json({
        success: false,
        message: `Category "${categoryName}" already exists`,
      });
    }

    // Find or create a system ministry to store categories
    const systemMinistry = await Ministry.findOneAndUpdate(
      { name: "System Categories" },
      {
        $addToSet: { tags: categoryName },
        $setOnInsert: {
          name: "System Categories",
          description: "System ministry for storing category tags",
          status: "inactive",
          icon: "tags",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: false, // Disable validators for system ministry
      },
    );

    console.log(`✅ Category "${categoryName}" added to system ministry`);

    res.status(201).json({
      success: true,
      message: `Category "${categoryName}" added successfully`,
      data: {
        category: categoryName,
        id: systemMinistry._id,
      },
    });
  } catch (error) {
    console.error("❌ Error adding ministry category:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add ministry category",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Add ministry category (Admin)
// export async function addMinistryCategory(req, res) {
//   try {
//     const { category } = req.body;

//     if (!category || category.trim().length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Category name is required'
//       });
//     }

//     const trimmedCategory = category.trim();

//     // Check if category already exists
//     const existingCategory = await Ministry.findOne({
//       tags: { $in: [new RegExp(`^${trimmedCategory}$`, 'i')] }
//     });

//     if (existingCategory) {
//       return res.status(400).json({
//         success: false,
//         message: 'Category already exists'
//       });
//     }

//     // Add category to one ministry to make it available (or you could create a separate Category model)
//     await Ministry.updateOne(
//       { name: 'System' }, // Use a system ministry or create one
//       { $addToSet: { tags: trimmedCategory } },
//       { upsert: true }
//     );

//     res.status(201).json({
//       success: true,
//       message: 'Ministry category added successfully',
//       data: { category: trimmedCategory }
//     });
//   } catch (error) {
//     console.error('Add ministry category error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to add ministry category',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// }
