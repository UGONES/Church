import Analytics from "../models/Analyitics.mjs";
import User from "../models/User.mjs";
import Donation from "../models/Donation.mjs";
import Event from "../models/Event.mjs";
import Sermon from "../models/Sermon.mjs";
import PrayerRequest from "../models/Prayer.mjs";
import Testimonial from "../models/Testimonial.mjs";

// Get service times
export async function getServiceTimes(req, res) {
  try {
    // This would typically come from settings or a database
    // For now, return sample data
    const serviceTimes = [
      {
        day: "Sunday",
        time: "10:00 AM",
        description: "Morning Worship Service",
        type: "main",
      },
      {
        day: "Sunday",
        time: "6:00 PM",
        description: "Evening Service",
        type: "evening",
      },
      {
        day: "Wednesday",
        time: "7:00 PM",
        description: "Bible Study & Prayer Meeting",
        type: "midweek",
      },
    ];

    res.json(serviceTimes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get church stats
export async function getChurchStats(req, res) {
  try {
    const [
      totalMembers,
      activeMembers,
      totalDonations,
      totalEvents,
      totalSermons,
      totalPrayers,
      totalTestimonials,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Donation.countDocuments({ status: "completed" }),
      Event.countDocuments({ status: "scheduled" }),
      Sermon.countDocuments({ status: "published" }),
      PrayerRequest.countDocuments({ status: "approved" }),
      Testimonial.countDocuments({ status: "approved" }),
    ]);

    // Calculate total donation amount
    const donationStats = await Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    const totalDonationAmount = donationStats[0]?.totalAmount || 0;

    res.json({
      totalMembers,
      activeMembers,
      totalDonations,
      totalDonationAmount: totalDonationAmount.toFixed(2),
      totalEvents,
      totalSermons,
      totalPrayers,
      totalTestimonials,
      updatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get hero content
export async function getHeroContent(req, res) {
  try {
    // This would typically come from a CMS or database
    const heroContent = {
      title: "Welcome to Our Church Family",
      subtitle: "Where Faith, Community, and Love Grow Together",
      backgroundImage: "/images/hero-bg.jpg",
      ctaText: "Join Us This Sunday",
      ctaLink: "/services",
      featuredVerses: [
        {
          text: '"For where two or three gather in my name, there am I with them."',
          reference: "Matthew 18:20",
        },
      ],
    };

    res.json(heroContent);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get live status
export async function getLiveStatus(req, res) {
  try {
    const liveSermon = await Sermon.findOne({
      isLive: true,
      liveStreamStatus: { $in: ["scheduled", "live"] },
    }).select("title speaker liveStreamUrl viewers startTime");

    res.json({
      isLive: !!liveSermon,
      liveSermon: liveSermon || null,
      viewers: liveSermon?.viewers || 0,
      nextService: await getNextServiceTime(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get dashboard stats (Admin)
export async function getDashboardStats(req, res) {
  try {
    const [
      totalUsers,
      newUsersThisWeek,
      totalDonations,
      donationAmount,
      totalPrayerRequests,
      totalTestimonials,
      upcomingEvents,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Donation.countDocuments({ status: "completed" }),
      Donation.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      PrayerRequest.countDocuments(),
      Testimonial.countDocuments(),
      Event.countDocuments({
        startTime: { $gte: new Date() },
        status: "scheduled",
      }),
    ]);

    // Get recent activity
    const recentActivity = await Analytics.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get donation statistics by time period
    const donationStats = await getDonationStats();

    res.json({
      overview: {
        totalUsers,
        newUsersThisWeek,
        totalDonations,
        donationAmount: donationAmount[0]?.total || 0,
        totalPrayerRequests,
        totalTestimonials,
        upcomingEvents,
      },
      donationStats,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Get recent activity (Admin)
export async function getRecentActivity(req, res) {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = {};
    if (type) query.type = type;

    const activities = await Analytics.find(query)
      .populate("userId", "name email")
      .populate("itemId")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Analytics.countDocuments(query);

    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Track analytics event
export async function trackEvent(req, res) {
  try {
    const { type, itemId, metadata } = req.body;

    const analytics = new Analytics({
      type,
      itemId,
      userId: req.user?._id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      metadata,
    });

    await analytics.save();

    // Update view counts for specific types
    if (type === "sermon" && itemId) {
      await Sermon.findByIdAndUpdate(itemId, { $inc: { views: 1 } });
    } else if (type === "event" && itemId) {
      await Event.findByIdAndUpdate(itemId, { $inc: { views: 1 } });
    }

    res.status(201).json({ message: "Event tracked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

// Helper functions
async function getNextServiceTime() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Sample service times - in real app, this would come from database
  const serviceTimes = [
    { day: 0, time: "10:00", type: "main" }, // Sunday 10:00 AM
    { day: 0, time: "18:00", type: "evening" }, // Sunday 6:00 PM
    { day: 3, time: "19:00", type: "midweek" }, // Wednesday 7:00 PM
  ];

  // Find next service
  for (const service of serviceTimes) {
    const serviceDate = new Date(now);
    const [hours, minutes] = service.time.split(":").map(Number);

    // Adjust day if needed
    let daysToAdd = service.day - dayOfWeek;
    if (daysToAdd < 0) daysToAdd += 7;

    serviceDate.setDate(now.getDate() + daysToAdd);
    serviceDate.setHours(hours, minutes, 0, 0);

    if (serviceDate > now) {
      return {
        date: serviceDate,
        type: service.type,
        daysUntil: Math.ceil((serviceDate - now) / (1000 * 60 * 60 * 24)),
      };
    }
  }

  return null;
}

async function getDonationStats() {
  const now = new Date();
  const oneMonthAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate(),
  );
  const threeMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 3,
    now.getDate(),
  );
  const oneYearAgo = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate(),
  );

  const [monthly, quarterly, yearly, allTime] = await Promise.all([
    Donation.aggregate([
      { $match: { status: "completed", createdAt: { $gte: oneMonthAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Donation.aggregate([
      { $match: { status: "completed", createdAt: { $gte: threeMonthsAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Donation.aggregate([
      { $match: { status: "completed", createdAt: { $gte: oneYearAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    monthly: {
      amount: monthly[0]?.total || 0,
      donations: monthly[0]?.count || 0,
    },
    quarterly: {
      amount: quarterly[0]?.total || 0,
      donations: quarterly[0]?.count || 0,
    },
    yearly: {
      amount: yearly[0]?.total || 0,
      donations: yearly[0]?.count || 0,
    },
    allTime: {
      amount: allTime[0]?.total || 0,
      donations: allTime[0]?.count || 0,
    },
  };
}
