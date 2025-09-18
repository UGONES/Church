import PrayerRequest from '../models/Prayer.mjs';

// Get all prayer requests
export async function getAllPrayerRequests(req, res) {
  try {
    const { page = 1, limit = 10, category } = req.query;

    const query = { status: 'approved', isPrivate: false };
    if (category) query.category = category;

    const prayerRequests = await PrayerRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const total = await PrayerRequest.countDocuments(query);

    res.json({
      prayerRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get prayer team
export async function getPrayerTeam(req, res) {
  try {
    res.json({
      team: [
        { name: 'Prayer Team Leader', role: 'Coordinator' },
        { name: 'Intercessory Prayer Group', role: 'Weekly Meeting' }
      ],
      meetingTimes: 'Wednesdays at 7:00 PM'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get prayer meetings
export async function getPrayerMeetings(req, res) {
  try {
    res.json([
      {
        day: 'Wednesday',
        time: '7:00 PM',
        location: 'Church Sanctuary',
        type: 'Intercessory Prayer'
      },
      {
        day: 'Sunday',
        time: '8:30 AM',
        location: 'Prayer Room',
        type: 'Pre-Service Prayer'
      }
    ]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Submit prayer request
export async function submitPrayerRequest(req, res) {
  try {
    const prayerData = req.body;

    if (req.user) {
      prayerData.userId = req.user._id;
    }

    const prayerRequest = new PrayerRequest(prayerData);
    await prayerRequest.save();

    res.status(201).json({
      message: 'Prayer request submitted successfully',
      prayerRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Pray for request
export async function prayForRequest(req, res) {
  try {
    const { id } = req.params;

    const prayerRequest = await PrayerRequest.findById(id);
    if (!prayerRequest) {
      return res.status(404).json({ message: 'Prayer request not found' });
    }

    if (req.user) {
      const alreadyPrayed = prayerRequest.prayedBy.some(
        prayer => prayer.user.toString() === req.user._id.toString()
      );

      if (!alreadyPrayed) {
        prayerRequest.prayedBy.push({ user: req.user._id, prayedAt: new Date() });
        prayerRequest.prayerCount += 1;
        await prayerRequest.save();
      }
    } else {
      prayerRequest.prayerCount += 1;
      await prayerRequest.save();
    }

    res.json({
      message: 'Prayer recorded',
      prayerCount: prayerRequest.prayerCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get all prayer requests (Admin)
export async function getAllPrayerRequestsAdmin(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const prayerRequests = await PrayerRequest.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const total = await PrayerRequest.countDocuments(query);

    res.json({
      prayerRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update prayer request (Admin)
export async function updatePrayerRequest(req, res) {
  try {
    const { id } = req.params;
    const prayerData = req.body;

    const prayerRequest = await PrayerRequest.findByIdAndUpdate(id, prayerData, {
      new: true,
      runValidators: true
    });

    if (!prayerRequest) {
      return res.status(404).json({ message: 'Prayer request not found' });
    }

    res.json({
      message: 'Prayer request updated successfully',
      prayerRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete prayer request (Admin)
export async function deletePrayerRequest(req, res) {
  try {
    const { id } = req.params;

    const prayerRequest = await PrayerRequest.findByIdAndDelete(id);
    if (!prayerRequest) {
      return res.status(404).json({ message: 'Prayer request not found' });
    }

    res.json({ message: 'Prayer request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get prayer stats (Admin)
export async function getPrayerStats(req, res) {
  try {
    const totalPrayers = await PrayerRequest.countDocuments();
    const answeredPrayers = await PrayerRequest.countDocuments({ status: 'answered' });
    const pendingPrayers = await PrayerRequest.countDocuments({ status: 'pending' });
    const privatePrayers = await PrayerRequest.countDocuments({ isPrivate: true });

    const categoryStats = await PrayerRequest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const urgencyStats = await PrayerRequest.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } }
    ]);

    const totalPrayersCount = await PrayerRequest.aggregate([
      { $group: { _id: null, total: { $sum: '$prayerCount' } } }
    ]);

    res.json({
      totalPrayers,
      answeredPrayers,
      pendingPrayers,
      privatePrayers,
      totalPrayersCount: totalPrayersCount[0]?.total || 0,
      categoryStats,
      urgencyStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
