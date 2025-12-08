import { getConnectionStatus } from '../config/db.mjs';
import Sermon from '../models/Sermon.mjs';
import Favorite from '../models/Favorite.mjs';
import { v4 as uuidv4 } from 'uuid';

const generateRecordingId = () => 'rec_' + uuidv4();

//////////////////////////
export const generateKey = async (sermonId = null) => {
  try {
    if (sermonId) {
      const sermon = await Sermon.findById(sermonId);
      if (!sermon) throw new Error("Sermon not found");
      return await sermon.generateStreamKey();
    }

    // if sermonId NOT provided → generate raw key
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString("hex");
    return `smc_${timestamp}_${random}`.substring(0, 32);

  } catch (error) {
    console.error('Error generating stream key:', error);
    throw error;
  }
};

//////////////////////////
// 📍 GET SERMONS
//////////////////////////

export async function getAllSermons(req, res) {
  try {
    const { page = 1, limit = 10, category, speaker, featured, series, status, isLive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (speaker) query.speaker = { $regex: speaker, $options: 'i' };
    if (featured === 'true') query.isFeatured = true;
    if (series) query.series = { $regex: series, $options: 'i' };
    if (status) query.status = status;
    if (isLive !== undefined) query.isLive = isLive === 'true';

    const sermons = await Sermon.find(query)
      .sort({ date: -1 })
      .populate('speakerId', 'name role avatar')
      .limit(limit)
      .skip((page - 1) * limit);

    const limitNumber = parseInt(limit);

    const total = await Sermon.countDocuments(query);

    res.json({
      success: true,
      sermons,
      totalPages: Math.ceil(total / limit),
      currentPage: +page,
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getLiveSermons(req, res) {
  try {
    const liveSermons = await Sermon.find({
      isLive: true,
      liveStreamStatus: { $in: ['scheduled', 'live'] }
    }).sort({ date: -1 });

    res.json({ success: true, data: liveSermons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getSermonCategories = async (_, res) => {
  try {
    const categories = await Sermon.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export async function getSermonStats(req, res) {
  try {
    const totalSermons = await Sermon.countDocuments();
    const publishedSermons = await Sermon.countDocuments({ status: 'published' });
    const liveSermons = await Sermon.countDocuments({ isLive: true });
    const draftSermons = await Sermon.countDocuments({ status: 'draft' });

    const totalViews = await Sermon.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    const categoryStats = await Sermon.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' }
        }
      }
    ]);

    const liveStreamStats = await Sermon.aggregate([
      {
        $match: { isLive: true }
      },
      {
        $group: {
          _id: null,
          totalLiveStreams: { $sum: 1 },
          totalViewers: { $sum: '$viewers' },
          avgViewers: { $avg: '$viewers' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalSermons,
        publishedSermons,
        liveSermons,
        draftSermons,
        totalViews: totalViews[0]?.total || 0,
        categoryStats,
        liveStreamStats: liveStreamStats[0] || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

//////////////////////////
// ⭐ FAVORITES
//////////////////////////

export async function getFavoriteSermons(req, res) {
  try {
    const favorites = await Favorite.find({
      userId: req.user._id,
      itemType: 'sermon'
    }).populate('itemId');

    res.json(favorites.map(f => f.itemId));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function addFavoriteSermon(req, res) {
  try {
    const exists = await Favorite.findOne({
      userId: req.user._id,
      itemType: 'sermon',
      itemId: req.params.id
    });

    if (exists) return res.status(400).json({ message: 'Already favorited' });

    const fav = new Favorite({
      userId: req.user._id,
      itemType: 'sermon',
      itemId: req.params.id
    });

    await fav.save();
    res.status(201).json({ message: 'Added to favorites' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function removeFavoriteSermon(req, res) {
  try {
    await Favorite.findOneAndDelete({
      userId: req.user._id,
      itemType: 'sermon',
      itemId: req.params.id
    });

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/////////////////////////////////
// ✳️ CREATE SERMON (NOT LIVE)
/////////////////////////////////

export async function createSermon(req, res) {
  try {
    const data = { ...req.body };
    if (!data.date) data.date = new Date();

    if (data.isLive) {
      if (!data.streamKey) data.streamKey = await generateKey();
      const rtmpPort = process.env.RTMP_PORT || 1935;
      const hlsPort = process.env.HLS_PORT || 8000;
      const hlsBase = process.env.HLS_BASE_URL || `http://localhost:${hlsPort}`;

      data.rtmpConfig = {
        serverUrl: data.rtmpConfig?.serverUrl || `rtmp://localhost:${rtmpPort}/live`,
        streamKey: data.streamKey,
        hlsUrl: data.rtmpConfig?.hlsUrl || `${hlsBase}/live/${data.streamKey}/index.m3u8`,
        autoRecord: data.autoRecord !== false,
        recordingFormat: data.recordingFormat || 'mp4'
      };
      data.recordingId = data.recordingId || generateRecordingId();
      data.recordingStatus = data.recordingStatus || (data.autoRecord ? 'not_started' : 'not_started');
      data.status = data.status || 'published';
    }

    // file uploads mapping
    if (req.files) {
      if (req.files.audio?.[0]?.path) data.audioUrl = data.processedAudioUrl = req.files.audio[0].path;
      if (req.files.video?.[0]?.path) data.videoUrl = data.processedVideoUrl = req.files.video[0].path;
      if (req.files.image?.[0]?.path) data.imageUrl = data.thumbnailUrl = req.files.image[0].path;
    }

    const sermon = new Sermon(data);
    await sermon.save();

    return res.status(201).json({
      success: true,
      message: 'Sermon created',
      sermon,
      streamingConfig: data.isLive ? sermon.getStreamerConfig() : null
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateSermon(req, res) {
  try {
    const { id } = req.params;
    const sermonData = req.body;

    // Handle recording completion
    if (sermonData.recordingStatus === 'completed') {
      sermonData.processedVideoUrl = sermonData.recordedVideoUrl;
      sermonData.processedAudioUrl = sermonData.recordedAudioUrl;
      sermonData.status = 'published';
      sermonData.isLive = false;
      sermonData.liveStreamStatus = 'ended';
    }

    // Handle file uploads from Cloudinary middleware
    if (req.files) {
      if (req.files.audio?.[0]?.path) sermonData.audioUrl = sermonData.processedAudioUrl = req.files.audio[0].path;
      if (req.files.video?.[0]?.path) sermonData.videoUrl = sermonData.processedVideoUrl = req.files.video[0].path;
      if (req.files.image?.[0]?.path) sermonData.imageUrl = sermonData.thumbnailUrl = req.files.image[0].path;
    }

    const sermon = await Sermon.findByIdAndUpdate(id, sermonData, {
      new: true,
      runValidators: true
    });

    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }

    res.json({
      success: true,
      message: 'Sermon updated successfully',
      sermon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export async function deleteSermon(req, res) {
  try {
    const { id } = req.params;

    const sermon = await Sermon.findById(id);
    if (!sermon) {
      return res.status(404).json({ message: 'Sermon not found' });
    }

    await Sermon.findByIdAndDelete(id);
    await Favorite.deleteMany({ itemType: 'sermon', itemId: id });

    res.json({ message: 'Sermon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

//////////////////////////
// 📡 LIVE STATUS
//////////////////////////

export async function getLiveStatus(req, res) {
  try {
    console.log('🔍 Checking live stream status...');

    // Method 1: Check for active live sermons in database
    const activeSermons = await Sermon.findActiveLiveStreams();

    if (activeSermons.length > 0) {
      const sermon = activeSermons[0];
      console.log('✅ Found active live sermon:', sermon.title);

      return res.json({
        success: true,
        isLive: true,
        data: {
          sermonId: sermon._id,
          title: sermon.title,
          speaker: sermon.speaker,
          description: sermon.description,
          liveStreamUrl: sermon.rtmpConfig?.hlsUrl || sermon.liveStreamUrl,
          streamKey: sermon.streamKey,
          viewers: sermon.viewers || 0,
          startedAt: sermon.liveStreamStartTime,
          duration: sermon.duration || 'Live'
        }
      });
    }

    // Method 2: Check RTMP server directly as fallback
    try {
      const mediaServerUrl = process.env.MEDIA_SERVER_URL || 'http://localhost:8001';
      const hlsBaseUrl = process.env.HLS_BASE_URL || 'http://localhost:8000';
      let response = null;

      try {
        response = await fetch(`${mediaServerUrl}/api/streams`);
      } catch (e) {
        response = await fetch(`${hlsBaseUrl}/api/streams`);
      }
      if (response.ok) {
        const data = await response.json();
        const activeStreams = Object.keys(data.live || {});

        if (activeStreams.length > 0) {
          const streamKey = activeStreams[0];
          const stream = data.live[streamKey];

          // Try to find matching sermon
          const matchingSermon = await Sermon.findOne({
            $or: [
              { streamKey: streamKey },
              { 'rtmpConfig.streamKey': streamKey }
            ],
            isLive: true
          });

          return res.json({
            success: true,
            isLive: true,
            data: {
              sermonId: matchingSermon?._id,
              title: matchingSermon?.title || 'Live Stream',
              speaker: matchingSermon?.speaker || 'Church Service',
              description: matchingSermon?.description,
              liveStreamUrl: `${hlsBaseUrl}/live/${streamKey}/index.m3u8`,
              streamKey: streamKey,
              viewers: stream.subscribers || 0,
              startedAt: new Date().toISOString(),
              duration: 'Live'
            }
          });
        }
      }
    } catch (rtmpError) {
      console.log('RTMP server check failed:', rtmpError.message);
    }

    // No live streams found
    console.log('❌ No active live streams found');
    return res.json({
      success: true,
      isLive: false,
      data: {
        offlineMessage: 'No live stream currently active. Check back later for our next service.'
      }
    });

  } catch (error) {
    console.error('❌ Error in getLiveStatus:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check live status',
      message: error.message
    });
  }
}

//////////////////////////
// 🎥 START LIVE STREAM
//////////////////////////

export async function startLiveStream(req, res) {
  try {
    const payload = req.body;
    if (!payload?.title || !payload?.speaker) {
      return res.status(400).json({ success: false, message: 'Title and speaker are required' });
    }

    // Ensure we have a stable streamKey
    const streamKey = payload.streamKey || await generateKey();

    const rtmpServer = payload.rtmpConfig?.serverUrl || process.env.RTMP_SERVER_URL || `rtmp://localhost:${process.env.RTMP_PORT || 1935}/live`;
    const hlsBase = process.env.HLS_BASE_URL || `http://localhost:${process.env.HLS_PORT || 8000}`;
    const hlsUrl = payload.rtmpConfig?.hlsUrl || `${hlsBase}/live/${streamKey}/index.m3u8`;

    const sermonData = {
      title: payload.title,
      speaker: payload.speaker,
      speakerId: payload.speakerId,
      description: payload.description || '',
      category: payload.category || 'sunday-service',
      date: payload.date || new Date(),
      // IMPORTANT: create as pending / scheduled, not isLive
      isLive: false,
      liveStreamStatus: payload.liveStreamStatus || 'pending',
      streamKey,
      recordingId: payload.recordingId || (`rec_${uuidv4()}`),
      rtmpConfig: {
        serverUrl: rtmpServer,
        streamKey,
        hlsUrl,
        autoRecord: payload.autoRecord !== false,
        recordingFormat: payload.recordingFormat || 'mp4'
      },
      recordingStatus: payload.autoRecord ? 'not_started' : 'not_started',
      status: 'published',
      imageUrl: payload.imageUrl || payload.thumbnailUrl || '/default-live-thumbnail.jpg',
    };

    // Try to create document; if streamKey already exists, return existing sermon
    let sermon;
    try {
      sermon = new Sermon(sermonData);
      await sermon.save();
    } catch (err) {
      // handle duplicate streamKey gracefully
      if (err.code === 11000) {
        sermon = await Sermon.findOne({ streamKey }).exec();
      } else {
        throw err;
      }
    }

    if (sermon) {
      Object.assign(sermon, sermonData);
      await sermon.save();
    }

    const streamingConfig = {
      rtmpUrl: rtmpServer,
      streamKey: sermon.streamKey,
      hlsPlaybackUrl: sermon.rtmpConfig?.hlsUrl || hlsUrl,
      obsConfiguration: { server: rtmpServer, key: sermon.streamKey }
    };

    // Emit socket that a pending live item is configured (optional)
    if (req.app?.get('io')) {
      req.app.get('io').emit('live:configured', {
        sermonId: sermon._id,
        title: sermon.title,
        streamKey: sermon.streamKey,
        hlsUrl: streamingConfig.hlsPlaybackUrl,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Live stream configured (pending). Start streaming from OBS to go live.',
      sermon,
      streamingConfig
    });
  } catch (error) {
    console.error('startLiveStream error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

//////////////////////////
// 🛑 STOP LIVE STREAM
//////////////////////////

export async function stopLiveStream(req, res) {
  try {
    const id = req.params.sermonId || req.body.sermonId;
    let streamKey = req.params.streamKey || req.body.streamKey;

    if (!streamKey) {
      return res.status(400).json({ message: "Stream key is required" });
    }

    console.log('🛑 Stopping live stream for sermon:', id);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Sermon ID is required' });
    }

    const sermon = (id ? await Sermon.findById(id) : null) || (await Sermon.findByStreamKey(streamKey));
    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    if (sermon.liveStreamStatus !== "live") {
      return res.status(400).json({ success: false, message: "Sermon is not currently live" });
    }

    const updateData = {
      isLive: false,
      liveStreamStatus: 'ended',
      liveStreamEndTime: new Date(),
      recordingStatus: sermon.recordingStatus === 'recording' ? 'completed' : sermon.recordingStatus
    };

    // Calculate duration if we have start and end times
    if (sermon.liveStreamStartTime && updateData.liveStreamEndTime) {
      const durationMs = new Date(updateData.liveStreamEndTime) - new Date(sermon.liveStreamStartTime);
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const durationHours = Math.floor(durationMinutes / 60);
      const remainingMinutes = durationMinutes % 60;

      updateData.duration = `${durationHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    }

    const updatedSermon = await Sermon.endLiveStream(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Live stream stopped:', id);

    // Emit socket event for live stream end
    if (req.app.get('io')) {
      req.app.get('io').emit('live:ended', {
        sermonId: updatedSermon._id,
        title: updatedSermon.title
      });
    }

    res.json({
      success: true,
      message: 'Live stream stopped successfully',
      sermon: updatedSermon
    });
  } catch (error) {
    console.error('❌ Error stopping live stream:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//////////////////////////
// 🎬 RECEIVE RECORDING
/////////////////////////

export async function getRecordings(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const recordings = await Sermon.find({
      $or: [
        { recordedVideoUrl: { $exists: true, $ne: null } },
        { recordedAudioUrl: { $exists: true, $ne: null } }
      ]
    })
      .sort({ recordingEndTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sermon.countDocuments({
      $or: [
        { recordedVideoUrl: { $exists: true, $ne: null } },
        { recordedAudioUrl: { $exists: true, $ne: null } }
      ]
    });

    res.json({
      success: true,
      recordings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function uploadRecording(req, res) {
  try {
    const { sermonId, recordingId = generateRecordingId() } = req.params;
    const { videoUrl, audioUrl, thumbnailUrl, duration } = req.body;

    const sermon = await Sermon.findById(sermonId || recordingId);

    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    sermon.recordingStatus = 'completed';
    sermon.recordedVideoUrl = videoUrl || sermon.recordedVideoUrl;
    sermon.recordedAudioUrl = audioUrl || sermon.recordedAudioUrl;
    sermon.processedVideoUrl = videoUrl || sermon.processedVideoUrl;
    sermon.processedAudioUrl = audioUrl || sermon.processedAudioUrl;
    if (thumbnailUrl) { sermon.thumbnailUrl = thumbnailUrl; sermon.imageUrl = thumbnailUrl; }
    if (duration) sermon.duration = duration;
    sermon.isLive = false;
    sermon.liveStreamStatus = 'ended';
    sermon.liveStreamEndTime = new Date();
    sermon.status = 'published';

    await sermon.save();

    res.json({
      success: true,
      message: 'Recording uploaded successfully and made available for playback',
      sermon
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

//////////////////////////
// 🔁 RTMP WEBHOOK EVENTS
//////////////////////////

export async function handleStreamWebhook(req, res) {
  try {
    const { app, name, addr, action } = req.body;
    console.log('🔔 RTMP Webhook Received:', { app, name, addr, action });

    // Immediate response to prevent timeouts
    res.json({ success: true, message: 'Webhook received, processing...' });

    // Process webhook asynchronously with retry logic
    processWebhookAsync({ app, name, addr, action });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.json({ success: false, message: 'Webhook received but processing failed' });
  }
}

async function storeFailedWebhook(webhookData) {
  try {
    const fs = await import('fs');
    const failedWebhooksPath = './failed-webhooks.json';

    let failedWebhooks = [];
    if (fs.existsSync(failedWebhooksPath)) {
      failedWebhooks = JSON.parse(fs.readFileSync(failedWebhooksPath, 'utf8') || '[]');
    }

    // Add timestamp and retry count
    const failedWebhook = {
      ...webhookData,
      failedAt: new Date().toISOString(),
      retryCount: 0
    };

    failedWebhooks.push(failedWebhook);
    fs.writeFileSync(failedWebhooksPath, JSON.stringify(failedWebhooks, null, 2));
    console.log('📝 Stored failed webhook for later retry');
  } catch (error) {
    console.error('❌ Error storing failed webhook:', error);
  }
}

async function retryFailedWebhooks() {
  try {
    const fs = await import('fs');
    const failedWebhooksPath = './failed-webhooks.json';

    if (!fs.existsSync(failedWebhooksPath)) return;

    const failedWebhooks = JSON.parse(fs.readFileSync(failedWebhooksPath, 'utf8') || '[]');

    if (failedWebhooks.length === 0) return;

    console.log(`🔄 Retrying ${failedWebhooks.length} failed webhooks...`);

    const successfulRetries = [];
    const stillFailed = [];

    for (const webhookData of failedWebhooks) {
      try {
        await processSingleWebhook(webhookData);
        successfulRetries.push(webhookData);
      } catch (error) {
        stillFailed.push(webhookData);
      }
    }

    // Update the failed webhooks file
    fs.writeFileSync(failedWebhooksPath, JSON.stringify(stillFailed, null, 2));

    console.log(`✅ Successfully retried ${successfulRetries.length} webhooks`);
    console.log(`❌ ${stillFailed.length} webhooks still failed`);

  } catch (error) {
    console.error('❌ Error retrying failed webhooks:', error);
  }
}

async function processSingleWebhook(webhookData) {
  const dbStatus = getConnectionStatus();

  if (!dbStatus.isConnected) {
    throw new Error('Database not connected');
  }

  const sermon = await Sermon.findOne({ streamKey: webhookData.name });

  if (!sermon) {
    console.log('❌ No sermon found for stream key:', webhookData.name);
    return;
  }

  const updateOperations = {
    publish: {
      liveStreamStatus: 'live',
      liveStreamStartTime: new Date(),
      isLive: true
    },
    unpublish: {
      isLive: false,
      liveStreamStatus: 'ended',
      liveStreamEndTime: new Date()
    },
    play: {
      $inc: { viewers: 1 }
    },
    stop: {
      $inc: { viewers: -1 }
    }
  };

  const operation = updateOperations[webhookData.action];
  if (operation) {
    await Sermon.findByIdAndUpdate(sermon._id, operation);
    console.log(`✅ ${webhookData.action} processed for:`, webhookData.name);
  }
}

async function processWebhookAsync(webhookData) {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processSingleWebhook(webhookData);
      console.log('✅ Webhook processed successfully');
      return;
    } catch (error) {
      console.error(`❌ Webhook processing attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } else {
        // Store failed webhook for later retry
        await storeFailedWebhook(webhookData);
        console.error('💥 Webhook processing failed after all retries');
      }
    }
  }
}

export async function getStreamConfig(req, res) {
  try {
    const { sermonId } = req.params;

    const sermon = await Sermon.findById(sermonId);
    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    res.json({
      success: true,
      config: {
        rtmpUrl: sermon.rtmpConfig?.serverUrl || process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live',
        streamKey: sermon.streamConfig?.streamKey || sermon.streamKey,
        hlsPlaybackUrl: sermon.streamConfig?.hlsUrl,
        webPlaybackUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/sermons/live/${sermon._id}`,
        sermonTitle: sermon.title,
        sermonDescription: sermon.description,
        recordingId: sermon.recordingId,
        autoRecord: sermon.autoRecord,
        recordingCallback: `${process.env.API_BASE_URL || 'http://localhost:5000/api'}/sermons/recordings/${sermonId}/${sermon.recordingId}/upload`,

      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function testStreamConnection(req, res) {
  try {
    const { sermonId } = req.params;

    const sermon = await Sermon.findById(sermonId);
    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    res.json({
      success: true,
      message: 'Stream configuration ready with recording enabled',
      result: {
        rtmpUrl: sermon.streamConfig?.serverUrl,
        streamKey: sermon.streamConfig?.streamKey,
        recordingId: sermon.recordingId,
        status: 'configured',
        recordingEnabled: sermon.autoRecord
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export async function getStreamHealth(req, res) {
  try {
    const { sermonId } = req.params;

    const sermon = await Sermon.findById(sermonId);
    if (!sermon) {
      return res.status(404).json({ success: false, message: 'Sermon not found' });
    }

    const health = {
      status: sermon.isLive ? 'live' : 'offline',
      viewers: sermon.viewers || 0,
      duration: sermon.liveStreamDuration || 0,
      recording: {
        status: sermon.recordingStatus,
        started: sermon.recordingStartTime,
        duration: sermon.currentLiveDuration
      },
      playbackUrls: {
        hls: sermon.rtmpConfig?.hlsUrl,
        dash: sermon.rtmpConfig?.dashUrl
      },
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

export { retryFailedWebhooks };
