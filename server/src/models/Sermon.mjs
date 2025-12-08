import { Schema, model } from 'mongoose';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';


const sermonSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  speaker: {
    type: String,
    required: true,
    trim: true
  },
  speakerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String,
    required: true
  },
  scripture: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['sunday-service', 'bible-study', 'prayer-meeting', 'youth', 'special', 'faith', 'hope', 'love'],
    default: 'sunday-service'
  },
  videoUrl: String,
  audioUrl: String,
  imageUrl: String,
  duration: {
    type: String,
    default: '00:00'
  },
  date: {
    type: Date,
    required: true
  },
  streamStatus: {
    type: String,
    enum: ['offline', 'live', 'paused'],
    default: 'offline'
  },

  // Live Streaming Fields - FIXED
  isLive: {
    type: Boolean,
    default: false
  },
  liveStreamUrl: String,
  liveStreamStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'starting', 'live', 'ended', 'failed', 'cancelled'],
    default: 'pending'
  },
  liveStreamStartTime: Date,
  liveStreamEndTime: Date,
  liveStreamDuration: Number, // in seconds

  // Streaming Platform
  streamingPlatform: {
    type: String,
    enum: ['youtube', 'vimeo', 'facebook', 'twitch', 'custom-rtmp', 'obs', 'vmix', 'wirecast'],
    default: 'custom-rtmp'
  },

  recordingId: {
    type: String,
    unique: true
  },

  streamKey: String,
  rtmpUrl: String,

  // Camera and Input Configuration
  streamInput: {
    type: {
      type: String,
      enum: ['camera', 'obs', 'vmix', 'wirecast', 'mobile', 'ip_camera', 'ndi'],
      default: 'obs'
    },
    cameraModel: String,
    encoderSettings: {
      videoCodec: { type: String, default: 'h264' },
      audioCodec: { type: String, default: 'aac' },
      resolution: { type: String, default: '1920x1080' },
      fps: { type: Number, default: 30 },
      videoBitrate: { type: Number, default: 4000 },
      audioBitrate: { type: Number, default: 128 },
      keyframeInterval: { type: Number, default: 2 }
    },
    connectionTested: { type: Boolean, default: false },
    lastConnectionTest: Date
  },

  // RTMP Configuration - FIXED: Match controller field names
  rtmpConfig: {
    serverUrl: String,
    streamKey: String,
    backupServerUrl: String,
    hlsUrl: String, // ADDED: For HLS playback URL
    autoRecord: { type: Boolean, default: true }, // ADDED
    recordingFormat: { type: String, default: 'mp4' }, // ADDED
    recordingQuality: { type: String, default: 'high' } // ADDED
  },

  // Multi-destination settings
  destinations: [{
    platform: {
      type: String,
      enum: ['youtube', 'facebook', 'twitch', 'linkedin', 'vimeo', 'custom_rtmp']
    },
    url: String,
    status: String,
    streamKey: String,
    isEnabled: { type: Boolean, default: true }
  }],

  // Recording Settings - FIXED: Add missing fields
  autoRecord: {
    type: Boolean,
    default: true
  },
  recordingStatus: {
    type: String,
    enum: ['not_started', 'recording', 'processing', 'completed', 'failed'],
    default: 'not_started'
  },
  recordedVideoUrl: String,
  recordedAudioUrl: String,
  recordingStartTime: Date,
  recordingEndTime: Date,

  // Video Processing - FIXED: Add missing processed URLs
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processedVideoUrl: String,
  processedAudioUrl: String,
  thumbnailUrl: String,

  // Stream Health Monitoring
  streamHealth: {
    status: { type: String, enum: ['excellent', 'good', 'fair', 'poor', 'offline'], default: 'good' },
    bitrate: Number,
    droppedFrames: Number,
    latency: Number,
    lastHealthCheck: Date
  },

  // Analytics
  viewers: {
    type: Number,
    default: 0
  },
  peakViewers: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [String],
  series: String,
  seriesPart: Number
}, {
  timestamps: true
});

// Indexes - ADDED for better live stream queries
sermonSchema.index({ date: -1 });
sermonSchema.index({ category: 1 });
sermonSchema.index({ isLive: 1 });
sermonSchema.index({ status: 1 });
sermonSchema.index({ speaker: 1 });
sermonSchema.index({ streamingPlatform: 1 });
sermonSchema.index({ streamKey: 1 }, { unique: true, sparse: true });
sermonSchema.index({ recordingId: 1 });
sermonSchema.index({ liveStreamStatus: 1 });

const buildStreamConfig = (streamKey) => {
  const rtmpServer = process.env.RTMP_SERVER_URL || "rtmp://localhost:1935/live";
  const hlsBase = process.env.HLS_BASE_URL || "http://localhost:8000";

  return {
    streamKey,
    rtmpUrl: `${rtmpServer}`,
    hlsPlaybackUrl: `${hlsBase}/live/${streamKey}/index.m3u8`,
    rtmpConfig: {
      serverUrl: `${rtmpServer}`,
      streamKey,
      hlsUrl: `${hlsBase}/live/${streamKey}/index.m3u8`,
    }
  };
};

// Virtual for live stream duration
sermonSchema.virtual('currentLiveDuration').get(function () {
  if (this.isLive && this.liveStreamStartTime) {
    return Math.floor((new Date() - this.liveStreamStartTime) / 1000);
  }
  return 0;
});

// Method to start live stream - UPDATED
sermonSchema.methods.startLiveStream = async function (streamKey) {
  if (!streamKey) throw new Error("Stream key required");

  const cfg = buildStreamConfig(streamKey);

  this.streamKey = streamKey;
  this.isLive = true;
  this.liveStreamStatus = "live";
  this.liveStreamStartTime = new Date();
  this.recordingStatus = "recording";
  this.rtmpConfig = cfg.rtmpConfig;

  await this.save();
  return this;
};

// Method to end live stream - UPDATED
sermonSchema.methods.endLiveStream = async function (recordingData = {}) {
  try {
    this.isLive = false;
    this.liveStreamStatus = 'ended';
    this.liveStreamEndTime = new Date();
    this.recordingStatus = 'completed';

    // Calculate duration
    if (this.liveStreamStartTime) {
      const duration = Math.floor((this.liveStreamEndTime - this.liveStreamStartTime) / 1000);
      this.liveStreamDuration = duration;

      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      const seconds = duration % 60;
      this.duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    if (recordingData.videoUrl) {
      this.recordedVideoUrl = recordingData.videoUrl;
      this.processedVideoUrl = recordingData.videoUrl;
      this.videoUrl = recordingData.videoUrl;
    }

    if (recordingData.audioUrl) {
      this.recordedAudioUrl = recordingData.audioUrl;
      this.processedAudioUrl = recordingData.audioUrl;
      this.audioUrl = recordingData.audioUrl;
    }

    if (recordingData.thumbnailUrl) {
      this.thumbnailUrl = recordingData.thumbnailUrl;
      this.imageUrl = recordingData.thumbnailUrl;
    }

    await this.save();
    return this;

  } catch (err) {
    throw err;
  }
};

sermonSchema.statics.endLiveStreamByStreamKey = async function (streamKey, recordingData = {}) {
  const sermon = await this.findOne({
    $or: [
      { streamKey },
      { 'rtmpConfig.streamKey': streamKey }
    ]
  });

  if (!sermon) {
    throw new Error(`No sermon found for streamKey: ${streamKey}`);
  }

  return sermon.endLiveStream(recordingData);
};

// Method to generate stream key - UPDATED
sermonSchema.methods.generateStreamKey = async function () {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(16).toString("hex");

  const key = `smc_${timestamp}_${randomBytes}`;
  this.streamKey = key;

  await this.save();
  return key; // return key, not this.save()

};

// Method to generate recording ID - UPDATED
sermonSchema.methods.generateRecordingId = function () {
  this.recordingId = 'rec_' + uuidv4();
  return this.save();
};

// Method to get OBS/VMIX conafiguration - UPDATED
sermonSchema.methods.getStreamerConfig = function () {
  const config = {
    server: this.rtmpConfig?.serverUrl || 'rtmp://localhost:1935/live',
    key: this.rtmpConfig?.streamKey || this.streamKey,
    settings: this.streamInput.encoderSettings,
    hlsPlaybackUrl: this.rtmpConfig?.hlsUrl || `http://localhost:8000/live/${this.streamKey}/index.m3u8`,
    recordingId: this.recordingId,
    autoRecord: this.autoRecord,
    recommendedSettings: {
      video: {
        encoder: 'x264',
        rate_control: 'CBR',
        bitrate: this.streamInput.encoderSettings.videoBitrate,
        keyint_sec: this.streamInput.encoderSettings.keyframeInterval,
        preset: 'veryfast',
        profile: 'high'
      },
      audio: {
        encoder: 'aac',
        bitrate: this.streamInput.encoderSettings.audioBitrate,
        sample_rate: 44100
      }
    },
    destinations: this.destinations
  };

  return config;
};

// Method to test stream connection - UPDATED
sermonSchema.methods.testStreamConnection = async function () {
  try {
    this.streamInput.connectionTested = true;
    this.streamInput.lastConnectionTest = new Date();
    await this.save();
    return {
      success: true,
      message: 'Connection test completed',
      config: this.getStreamerConfig()
    };
  } catch (error) {
    throw new Error(`Connection test failed: ${error.message}`);
  }
};

// Static method to find active live streams - UPDATED
sermonSchema.statics.findActiveLiveStreams = function () {
  return this.find({
    isLive: true,
    liveStreamStatus: { $in: ['live', 'scheduled'] },
    $or: [
      { liveStreamEndTime: { $exists: false } },
      { liveStreamEndTime: null },
      { liveStreamEndTime: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
    ]
  }).sort({ liveStreamStartTime: -1 });
};

// Static method to find by stream key - ADDED
sermonSchema.statics.findByStreamKey = function (streamKey) {
  return this.findOne({
    $or: [
      { streamKey: streamKey },
      { 'rtmpConfig.streamKey': streamKey }
    ]
  });
};

// Pre-save middleware to ensure consistency - UPDATED
sermonSchema.pre('save', function (next) {
  // Ensure stream key is set for live streams
  if (this.isLive && !this.streamKey) {
    this.generateStreamKey();
  }

  // Ensure recording ID is set if autoRecord is enabled
  if (this.autoRecord && !this.recordingId) {
    this.generateRecordingId();
  }

  // Update HLS URL if not set
  if (this.streamKey && (!this.rtmpConfig?.hlsUrl)) {
    if (!this.rtmpConfig) this.rtmpConfig = {};
    this.rtmpConfig.hlsUrl = `http://localhost:8000/live/${this.streamKey}/index.m3u8`;
  }

  next();
});

export default model('Sermon', sermonSchema);