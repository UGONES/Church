import Sermon from '../models/Sermon.mjs';
import Favorite from '../models/Favorite.mjs';

// Get all sermons
export async function getAllSermons(req, res) {
  try {
    const { page = 1, limit = 10, category, speaker, featured, series } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (speaker) query.speaker = { $regex: speaker, $options: 'i' };
    if (featured === 'true') query.isFeatured = true;
    if (series) query.series = { $regex: series, $options: 'i' };

    const sermons = await Sermon.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sermon.countDocuments(query);

    res.json({
      sermons,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get live sermons
export async function getLiveSermons(req, res) {
  try {
    const liveSermons = await Sermon.find({
      isLive: true,
      liveStreamStatus: { $in: ['scheduled', 'live'] }
    }).sort({ date: -1 });

    res.json(liveSermons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get sermon categories
export async function getSermonCategories(req, res) {
  try {
    const categories = await Sermon.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get featured sermons
export async function getFeaturedSermons(req, res) {
  try {
    const { limit = 3 } = req.query;
    const sermons = await Sermon.find({ isFeatured: true })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(sermons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get favorite sermons
export async function getFavoriteSermons(req, res) {
  try {
    const favorites = await Favorite.find({
      userId: req.user._id,
      itemType: 'sermon'
    }).populate('itemId');

    res.json(favorites.map(fav => fav.itemId));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Add favorite sermon
export async function addFavoriteSermon(req, res) {
  try {
    const { id } = req.params;

    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      itemType: 'sermon',
      itemId: id
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Sermon already in favorites' });
    }

    const favorite = new Favorite({
      userId: req.user._id,
      itemType: 'sermon',
      itemId: id
    });

    await favorite.save();
    res.status(201).json({ message: 'Sermon added to favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Remove favorite sermon
export async function removeFavoriteSermon(req, res) {
  try {
    const { id } = req.params;

    await Favorite.findOneAndDelete({
      userId: req.user._id,
      itemType: 'sermon',
      itemId: id
    });

    res.json({ message: 'Sermon removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Create sermon (Admin)
export async function createSermon(req, res) {
  try {
    const sermonData = req.body;
    
    if (req.files) {
      if (req.files.audio) sermonData.audioUrl = req.files.audio[0].path;
      if (req.files.video) sermonData.videoUrl = req.files.video[0].path;
      if (req.files.image) sermonData.imageUrl = req.files.image[0].path;
    }

    const sermon = new Sermon(sermonData);
    await sermon.save();

    res.status(201).json({
      message: 'Sermon created successfully',
      sermon
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update sermon (Admin)
export async function updateSermon(req, res) {
  try {
    const { id } = req.params;
    const sermonData = req.body;

    if (req.files) {
      if (req.files.audio) sermonData.audioUrl = req.files.audio[0].path;
      if (req.files.video) sermonData.videoUrl = req.files.video[0].path;
      if (req.files.image) sermonData.imageUrl = req.files.image[0].path;
    }

    const sermon = await Sermon.findByIdAndUpdate(id, sermonData, {
      new: true,
      runValidators: true
    });

    if (!sermon) {
      return res.status(404).json({ message: 'Sermon not found' });
    }

    res.json({
      message: 'Sermon updated successfully',
      sermon
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete sermon (Admin)
export async function deleteSermon(req, res) {
  try {
    const { id } = req.params;

    const sermon = await Sermon.findByIdAndDelete(id);
    
    if (!sermon) {
      return res.status(404).json({ message: 'Sermon not found' });
    }

    await Favorite.deleteMany({ itemType: 'sermon', itemId: id });

    res.json({ message: 'Sermon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get sermon stats (Admin)
export async function getSermonStats(req, res) {
  try {
    const totalSermons = await Sermon.countDocuments();
    const publishedSermons = await Sermon.countDocuments({ status: 'published' });
    const liveSermons = await Sermon.countDocuments({ isLive: true });
    const totalViews = await Sermon.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    const categoryStats = await Sermon.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    res.json({
      totalSermons,
      publishedSermons,
      liveSermons,
      totalViews: totalViews[0]?.total || 0,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Start live stream (Admin)
export async function startLiveStream(req, res) {
  try {
    const { sermonId, liveStreamUrl } = req.body;

    const sermon = await Sermon.findByIdAndUpdate(
      sermonId,
      {
        isLive: true,
        liveStreamStatus: 'live',
        liveStreamUrl,
        date: new Date()
      },
      { new: true }
    );

    if (!sermon) {
      return res.status(404).json({ message: 'Sermon not found' });
    }

    res.json({
      message: 'Live stream started successfully',
      sermon
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Stop live stream (Admin)
export async function stopLiveStream(req, res) {
  try {
    const { sermonId } = req.body;

    const sermon = await Sermon.findByIdAndUpdate(
      sermonId,
      {
        isLive: false,
        liveStreamStatus: 'ended'
      },
      { new: true }
    );

    if (!sermon) {
      return res.status(404).json({ message: 'Sermon not found' });
    }

    res.json({
      message: 'Live stream stopped successfully',
      sermon
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
