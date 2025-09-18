// donationController.mjs
import Donation from '../models/Donation.mjs';
import Stripe from 'stripe';
import paymentService from '../utils/paymentService.mjs';
import User from '../models/User.mjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create PaymentIntent (for frontend)
export async function createPaymentIntent(req, res) {
  try {
    const { amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid donation amount' });
    }

    // Create Stripe PaymentIntent via paymentService
    const intentResponse = await paymentService.createPaymentIntent(
      amount, 
      currency, 
      {
        userId: req.user?._id?.toString() || 'guest',
        purpose: req.body.purpose || 'general'
      }
    );

    if (!intentResponse.success) {
      return res.status(500).json({ message: intentResponse.error });
    }

    res.json({
  clientSecret: intentResponse.clientSecret,
  paymentIntentId: intentResponse.paymentIntentId
});
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Get user donations
export async function getUserDonations(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const donations = await Donation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments({ userId: req.user._id });

    res.json({
      donations,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Create donation & Stripe PaymentIntent
export async function createDonation(req, res) {
  try {
    const { 
      amount, 
      frequency, 
      paymentMethod, 
      isAnonymous, 
      dedication, 
      purpose,
      bankDetails,
      email,
      name
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid donation amount' });
    }

    let userId = req.user?._id;
    let donorName = req.user?.name;
    let donorEmail = req.user?.email;
    let stripePaymentIntentId = null;

    // Handle guest donations
    if (!userId) {
      if (!email) {
        return res.status(400).json({ message: 'Email is required for guest donations' });
      }
      donorEmail = email;
      donorName = isAnonymous ? 'Anonymous' : (name || 'Anonymous Donor');
    }

    // Handle card payments
    if (paymentMethod === 'card') {
      const intentResponse = await paymentService.createPaymentIntent(amount, 'usd', {
        userId: userId?.toString() || 'guest',
        frequency,
        isAnonymous: isAnonymous?.toString() || 'false',
        dedication: dedication || '',
        purpose: purpose || 'general'
      });

      if (!intentResponse.success) {
        return res.status(500).json({ message: intentResponse.error });
      }
      stripePaymentIntentId = intentResponse.paymentIntentId;
    }

    // Create donation record
    const donation = new Donation({
      userId: userId || null,
      amount,
      frequency,
      paymentMethod,
      isAnonymous,
      dedication,
      purpose: purpose || 'general',
      bankDetails: paymentMethod === 'bank' ? bankDetails : undefined,
      status: paymentMethod === 'bank' ? 'pending' : 'processing',
      stripePaymentIntentId,
      donorName,
      donorEmail
    });

    await donation.save();

    // For card payments, return client secret for frontend confirmation
    if (paymentMethod === 'card') {
      const intentResponse = await paymentService.createPaymentIntent(amount, 'usd', {
        userId: userId?.toString() || 'guest',
        frequency,
        isAnonymous: isAnonymous?.toString() || 'false',
        dedication: dedication || '',
        purpose: purpose || 'general'
      });

      res.json({
        success: true,
        donationId: donation._id,
        clientSecret: intentResponse.clientSecret,
        requiresAction: paymentMethod === 'card'
      });
    } else {
      // For bank transfers, just confirm creation
      res.json({
        success: true,
        donationId: donation._id,
        message: 'Bank transfer donation created successfully'
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Confirm card payment (after frontend confirmation)
export async function confirmCardPayment(req, res) {
  try {
    const { donationId, paymentIntentId } = req.body;
    
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      donation.status = 'completed';
      await donation.save();
      
      res.json({ 
        success: true, 
        message: 'Payment confirmed successfully' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Download receipt
export async function downloadReceipt(req, res) {
  try {
    const { id } = req.params;

    const donation = await Donation.findOne({
      _id: id,
      $or: [
        { userId: req.user?._id },
        { donorEmail: req.user?.email }
      ],
      status: 'completed'
    });

    if (!donation) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.json({
      message: 'Receipt generated successfully',
      receipt: {
        donationId: donation._id,
        date: donation.createdAt,
        amount: donation.amount,
        donorName: donation.donorName,
        isAnonymous: donation.isAnonymous,
        purpose: donation.purpose
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Admin controllers
export async function getAllDonations(req, res) {
  try {
    const { page = 1, limit = 10, status, paymentMethod } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const donations = await Donation.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function updateDonation(req, res) {
  try {
    const { id } = req.params;
    const donationData = req.body;

    const donation = await Donation.findByIdAndUpdate(id, donationData, {
      new: true,
      runValidators: true
    }).populate('userId', 'name email');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json({ message: 'Donation updated successfully', donation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getDonationStats(req, res) {
  try {
    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.countDocuments({ status: 'completed' });
    
    const totalAmount = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const frequencyStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$frequency',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyStats = await Donation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const paymentMethodStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      totalDonations,
      completedDonations,
      totalAmount: totalAmount[0]?.total || 0,
      frequencyStats,
      monthlyStats,
      paymentMethodStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getRecentDonations(req, res) {
  try {
    const donations = await Donation.find({ status: 'completed' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function exportDonations(req, res) {
  try {
    const { format = 'csv' } = req.query;
    const donations = await Donation.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = donations.map(d => ({
        id: d._id,
        date: d.createdAt,
        amount: d.amount,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        status: d.status,
        frequency: d.frequency,
        paymentMethod: d.paymentMethod,
        purpose: d.purpose
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=donations.csv');

      let csv = 'ID,Date,Amount,Donor Name,Donor Email,Status,Frequency,Payment Method,Purpose\n';
      csvData.forEach(row => {
        csv += `${row.id},${row.date},${row.amount},${row.donorName},${row.donorEmail},${row.status},${row.frequency},${row.paymentMethod},${row.purpose}\n`;
      });

      return res.send(csv);
    }

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}