import Setting from '../models/Setting.mjs';

// Get settings
export async function getSettings(req, res) {
  try {
    let settings = await Setting.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Setting({
        churchName: 'Our Church',
        contactEmail: 'info@church.com',
        contactPhone: '(555) 123-4567'
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Update settings (Admin)
export async function updateSettings(req, res) {
  try {
    const settingsData = req.body;

    let settings = await Setting.findOne();
    
    if (!settings) {
      settings = new Setting(settingsData);
      await settings.save();
    } else {
      settings = await Setting.findOneAndUpdate(
        {},
        settingsData,
        { new: true, runValidators: true, upsert: true }
      );
    }

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Reset settings to default (Admin)
export async function resetSettings(req, res) {
  try {
    await Setting.deleteMany({});

    const defaultSettings = new Setting({
      churchName: 'Our Church',
      contactEmail: 'info@church.com',
      contactPhone: '(555) 123-4567',
      serviceTimes: [
        { day: 'Sunday', time: '10:00 AM', description: 'Morning Service' },
        { day: 'Wednesday', time: '7:00 PM', description: 'Bible Study' }
      ]
    });

    await defaultSettings.save();

    res.json({
      message: 'Settings reset to default successfully',
      settings: defaultSettings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
