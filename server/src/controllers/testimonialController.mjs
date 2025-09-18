import Testimonial from '../models/Testimonial.mjs';

// Get all testimonials
export async function getAllTestimonials(req, res) {
  try {
    const { page = 1, limit = 10, category, approved } = req.query;

    const query = {};
    if (category) query.category = category;
    if (approved === 'true') query.status = { $in: ['approved', 'featured'] };

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Testimonial.countDocuments(query);

    res.json({
      testimonials,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get approved testimonials
export async function getApprovedTestimonials(req, res) {
  try {
    const { limit = 6 } = req.query;
    const testimonials = await Testimonial.find({
      status: { $in: ['approved', 'featured'] }
    })
      .sort({ featuredAt: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get video testimonials
export async function getVideoTestimonials(req, res) {
  try {
    const testimonials = await Testimonial.find({
      isVideo: true,
      status: { $in: ['approved', 'featured'] }
    }).sort({ createdAt: -1 });

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get testimonial categories
export async function getTestimonialCategories(req, res) {
  try {
    const categories = await Testimonial.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Submit testimonial
export async function submitTestimonial(req, res) {
  try {
    const testimonialData = req.body;

    if (req.file) {
      testimonialData.imageUrl = req.file.path;
    }

    const testimonial = new Testimonial({
      ...testimonialData,
      status: 'pending'
    });

    await testimonial.save();

    res.status(201).json({
      message:
        'Testimonial submitted successfully. It will be reviewed before publishing.',
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get all testimonials (Admin)
export async function getAllTestimonialsAdmin(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Testimonial.countDocuments(query);

    res.json({
      testimonials,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Create testimonial (Admin)
export async function createTestimonial(req, res) {
  try {
    const testimonialData = req.body;

    if (req.file) {
      testimonialData.imageUrl = req.file.path;
    }

    const testimonial = new Testimonial(testimonialData);
    await testimonial.save();

    res.status(201).json({
      message: 'Testimonial created successfully',
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update testimonial (Admin)
export async function updateTestimonial(req, res) {
  try {
    const { id } = req.params;
    const testimonialData = req.body;

    if (req.file) {
      testimonialData.imageUrl = req.file.path;
    }

    const testimonial = await Testimonial.findByIdAndUpdate(id, testimonialData, {
      new: true,
      runValidators: true
    });

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    res.json({
      message: 'Testimonial updated successfully',
      testimonial
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete testimonial (Admin)
export async function deleteTestimonial(req, res) {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get testimonial stats (Admin)
export async function getTestimonialStats(req, res) {
  try {
    const totalTestimonials = await Testimonial.countDocuments();
    const approvedTestimonials = await Testimonial.countDocuments({
      status: 'approved'
    });
    const featuredTestimonials = await Testimonial.countDocuments({
      status: 'featured'
    });
    const pendingTestimonials = await Testimonial.countDocuments({
      status: 'pending'
    });

    const categoryStats = await Testimonial.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = await Testimonial.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalTestimonials,
      approvedTestimonials,
      featuredTestimonials,
      pendingTestimonials,
      categoryStats,
      statusStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
