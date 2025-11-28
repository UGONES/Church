import { Router, raw } from 'express';
const router = Router();
import { handleStripeWebhook } from '../controllers/webhookController.mjs';
import Sermon from '../models/Sermon.mjs';

// Stripe webhook endpoint
router.post('/stripe', raw({ type: 'application/json' }), handleStripeWebhook);



const debugEndpoints = ['connect', 'disconnect', 'publish', 'unpublish', 'play', 'stop'];

debugEndpoints.forEach(ep => {
  router.get(`/stream/${ep}`, (req, res) => {
    console.log(`🔹 [DEBUG] GET /stream/${ep} called`);
    res.status(200).json({
      success: true,
      message: `Webhook endpoint /stream/${ep} is accessible`,
      note: 'This should be called via POST by your RTMP server'
    });
  });
});



router.post('/stream/publish', async (req, res) => {
  try {
    const streamKey = req.body?.name || req.body?.stream || req.body?.streamKey || (req.body?.streamPath ? req.body.streamPath.split("/").pop() : null);
    console.log('RTMP publish webhook', { streamKey, body: req.body });

    if (!streamKey) return res.status(400).json({ success: false, message: 'Missing stream key' });

    const sermon = await Sermon.findByStreamKey(streamKey);

    if (!sermon) {
      console.warn('🔎 publish webhook: no sermon matching streamKey:', streamKey);
      // Return success to webhook to avoid retries but include note
      return res.status(200).json({ success: false, note: 'no-matching-sermon', message: 'No sermon configured for this stream key' });
    }

    // Atomic activation - set live fields
    sermon.isLive = true;
    sermon.liveStreamStatus = 'live';
    sermon.liveStreamStartTime = new Date();
    sermon.recordingStatus = sermon.autoRecord ? 'recording' : sermon.recordingStatus || 'not_started';
    sermon.rtmpConfig = sermon.rtmpConfig || {};
    sermon.rtmpConfig.hlsUrl = sermon.rtmpConfig.hlsUrl || `${process.env.HLS_BASE_URL || 'http://localhost:8000'}/live/${streamKey}/index.m3u8`;
    sermon.streamKey = sermon.streamKey || streamKey;

    await sermon.save();

    // Notify sockets
    try {
      if (req.app && req.app.get('io')) {
        req.app.get('io').emit('stream_status_changed', {
          type: 'stream_started',
          sermonId: sermon._id,
          sermonTitle: sermon.title,
          streamKey,
          timestamp: new Date()
        });
      }
    } catch (e) { console.warn('socket emit error', e.message); }

    return res.status(200).json({ success: true, sermonId: sermon._id });
  } catch (err) {
    console.error('publish webhook error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/stream/unpublish', async (req, res) => {
  try {
    let streamKey = req.body?.name || req.body?.stream || req.body?.streamKey;
    let appName = req.body?.app || req.body?.action;
    let streamPath = req.body?.streamPath || req.body?.path;

    console.log("📥 Incoming RTMP webhook:", { appName, streamPath, streamKey });

    if (!streamKey) {
      console.log("❌ No stream key found in webhook");
      return res.status(400).json({ success: false, message: "❌ No stream key found in webhook" });
    }

    const sermon = await Sermon.findByStreamKey(streamKey);

    if (!sermon) {
      console.warn('🔎 No sermon found for streamKey:', streamKey);
      return res.json({ success: true, note: 'no-matching-sermon' });
    }

    await Sermon.endLiveStreamByStreamKey(streamKey, {
      videoUrl: sermon.recordedVideoUrl || sermon.processedVideoUrl,
      audioUrl: sermon.recordedAudioUrl || sermon.processedAudioUrl,
      thumbnailUrl: sermon.thumbnailUrl
    });

    if (sermon.hasEnded === true) {
      console.log('✅ [WEBHOOK] Sermon marked as ended:', sermon.title);
    }
    // Emit socket event
    try {
      if (req.app && req.app.get('io')) {
        req.app.get('io').emit('stream_status_changed', {
          type: 'stream_ended',
          sermonId: sermon._id,
          sermonTitle: sermon.title,
          streamKey,
          timestamp: new Date()
        });
      }
    } catch (e) { console.warn('socket emit error', e.message); }

    return res.json({ success: true, sermonId: sermon._id });
  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/stream/connect', async (req, res) => {
  console.log('🔌 [WEBHOOK] Client connected:', req.body);
  res.status(200).json({ success: true });
});

router.post('/stream/disconnect', async (req, res) => {
  console.log('❌ [WEBHOOK] Client disconnected:', req.body);
  res.status(200).json({ success: true });
});

router.post('/stream/play', async (req, res) => {
  try {
    const { app, name: streamKey, addr } = req.body;
    console.log('📺 [WEBHOOK] Viewer started playing:', { app, streamKey, addr });

    if (!streamKey) return res.status(400).json({ success: false, message: 'Missing stream key' });

    const sermon = await Sermon.findByStreamKey(streamKey);
    if (sermon) {
      sermon.viewers = (sermon.viewers || 0) + 1;
      sermon.peakViewers = Math.max(sermon.peakViewers || 0, sermon.viewers);
      await sermon.save();
    }

    console.log('✅ [WEBHOOK] Incremented viewer count for streamKey:', streamKey);
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ webhook play error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/stream/stop', async (req, res) => {
  try {
    const { app, name: streamKey, addr } = req.body;
    console.log('⏹️ [WEBHOOK] Viewer stopped playing:', { app, streamKey, addr });
    if (!streamKey) return res.status(400).json({ success: false, message: 'Missing stream key' });

    // decrement safely
    const sermon = await Sermon.findByStreamKey(streamKey);
    if (sermon) {
      sermon.viewers = Math.max(0, (sermon.viewers || 0) - 1);
      await sermon.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ webhook stop error', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
export default router;