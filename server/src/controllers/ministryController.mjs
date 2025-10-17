// ministryController.mjs

import Ministry from '../models/Ministry.mjs';
import Volunteer from '../models/Volunteer.mjs';
import User from '../models/User.mjs';

// Get all ministries
export async function getAllMinistries(req, res) {
  try {
    const { page = 1, limit = 10, status, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.tags = category;

    const ministries = await Ministry.find(query)
      .populate('leaders.user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ministry.countDocuments(query);

    res.json({
      ministries,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get volunteer opportunities
export async function getVolunteerOpportunities(req, res) {
  try {
    const ministries = await Ministry.find({ status: 'active' })
      .select('name description volunteerNeeds')
      .sort({ name: 1 });

    res.json(ministries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get user's ministries and volunteer roles
export async function getUserMinistries(req, res) {
  try {
    const volunteerRoles = await Volunteer.find({ userId: req.user._id })
      .populate('ministryId', 'name description imageUrl')
      .select('ministryId role status');

    res.json(volunteerRoles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Volunteer for ministry
export async function volunteerForMinistry(req, res) {
  try {
    const { id } = req.params;
    const { interests, availability, skills, experience, message } = req.body;

    const existingVolunteer = await Volunteer.findOne({
      userId: req.user._id,
      ministryId: id,
    });

    if (existingVolunteer) {
      return res
        .status(400)
        .json({ message: 'You have already applied to volunteer for this ministry' });
    }

    const volunteer = new Volunteer({
      userId: req.user._id,
      ministryId: id,
      interests,
      availability,
      skills,
      experience,
      message,
      status: 'pending',
    });

    await volunteer.save();
    await volunteer.populate('ministryId', 'name');

    res.status(201).json({
      message: 'Volunteer application submitted successfully',
      volunteer,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Contact ministry leaders
export async function contactMinistryLeaders(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ministry = await Ministry.findById(id).populate('leaders.user', 'email name');

    if (!ministry) {
      return res.status(404).json({ message: 'Ministry not found' });
    }

    // In a real application, send emails to ministry leaders here
    const leaderEmails = ministry.leaders.map((leader) => leader.user.email);

    res.json({
      message: 'Message sent to ministry leaders successfully',
      recipients: leaderEmails,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Create ministry (Admin)
export async function createMinistry(req, res) {
  try {
    const ministryData = req.body;

    if (req.file) {
      ministryData.imageUrl = req.file.path;
    }

    const ministry = new Ministry(ministryData);
    await ministry.save();

    res.status(201).json({
      message: 'Ministry created successfully',
      ministry,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update ministry (Admin)
export async function updateMinistry(req, res) {
  try {
    const { id } = req.params;
    const ministryData = req.body;

    if (req.file) {
      ministryData.imageUrl = req.file.path;
    }

    const ministry = await Ministry.findByIdAndUpdate(id, ministryData, {
      new: true,
      runValidators: true,
    });

    if (!ministry) {
      return res.status(404).json({ message: 'Ministry not found' });
    }

    res.json({
      message: 'Ministry updated successfully',
      ministry,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete ministry (Admin)
export async function deleteMinistry(req, res) {
  try {
    const { id } = req.params;

    const ministry = await Ministry.findByIdAndDelete(id);

    if (!ministry) {
      return res.status(404).json({ message: 'Ministry not found' });
    }

    // Also delete related volunteers
    await Volunteer.deleteMany({ ministryId: id });

    res.json({ message: 'Ministry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get ministry stats (Admin)
export async function getMinistryStats(req, res) {
  try {
    const totalMinistries = await Ministry.countDocuments();
    const activeMinistries = await Ministry.countDocuments({ status: 'active' });
    const totalVolunteers = await Volunteer.countDocuments();
    const pendingVolunteers = await Volunteer.countDocuments({ status: 'pending' });

    const ministryStats = await Ministry.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalMinistries,
      activeMinistries,
      totalVolunteers,
      pendingVolunteers,
      statusDistribution: ministryStats,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get ministry volunteers (Admin)
export async function getMinistryVolunteers(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const query = { ministryId: id };
    if (status) query.status = status;

    const volunteers = await Volunteer.find(query)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get ministry categories
export async function getMinistryCategories(req, res) {
  try {
    const categories = await Ministry.distinct('tags');
    res.json(categories.filter((cat) => cat)); // Remove empty/null values
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Create ministry category (Admin)
export async function createMinistryCategory(req, res) {
  try {
    const { name } = req.body;

    const category = new Ministry.distinct({ tags: [name] });
    await category.save();

    res.status(201).json({ message: 'Ministry category created successfully', category, });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
