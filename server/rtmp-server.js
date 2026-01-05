import NodeMediaServer from 'node-media-server';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import http from 'http';
import https from 'https';
import net from 'net';
import fs from 'fs';

import { retryFailedWebhooks } from './src/controllers/sermonController.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mediaDir = path.join(__dirname, 'media');
const liveDir = path.join(mediaDir, 'live');


const isProduction = process.env.NODE_ENV === 'production';
const domain = process.env.DOMAIN || 'localhost';

if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
  if (isProduction) fs.chmodSync(mediaDir, 0o755);
}

if (!fs.existsSync(liveDir)) {
  fs.mkdirSync(liveDir, { recursive: true });
  if (isProduction) fs.chmodSync(liveDir, 0o755);
}

const checkPort = (port) => new Promise(resolve => {
  const s = net.createServer();
  s.once('error', () => { resolve(false); });
  s.once('listening', () => { s.close(); resolve(true); });
  s.listen(port);
});

export async function startNodeMediaServer(options = {}) {
  let rtmpPort = parseInt(process.env.RTMP_PORT || 1935, 10);
  let httpPort = parseInt(process.env.HLS_PORT || 8000, 10);
  let apiPort = parseInt(process.env.STREAMS_API_PORT || 8001, 10);

  if (isProduction) {
    rtmpPort = 1935;
    httpPort = 8000;
    apiPort = 8001;
  } else {
    if (!(await checkPort(rtmpPort))) { rtmpPort++; console.log(`RTMP port in use, trying ${rtmpPort}`); }
    if (!(await checkPort(httpPort))) { httpPort++; console.log(`HTTP/HLS port in use, trying ${httpPort}`); }
    if (!(await checkPort(apiPort))) { apiPort = 8002; console.log(`API port in use, using ${apiPort}`); }
  }

  const config = {
    rtmp: {
      port: rtmpPort,
      chunk_size: 60000,
      gop_cache: true,
      ping: 30,
      ping_timeout: 60
    },
    http: {
      port: httpPort,
      mediaroot: path.join(__dirname, 'media'),
      allow_origin: '*',
      webroot: path.join(__dirname, 'client', 'dist')
    },
    auth: {
      play: (process.env.RTMP_AUTH_PLAY === 'true') || isProduction || false,
      publish: (process.env.RTMP_AUTH_PUBLISH === 'true') || isProduction || false,
      secret: process.env.RTMP_SECRET || process.env.JWT_SECRET || (isProduction ? null : 'supersecret')
    },
    relay: {
      ffmpeg: process.env.FFMPEG_PATH || 'ffmpeg',
      tasks: []
    },
    trans: {
      ffmpeg: process.env.FFMPEG_PATH || 'ffmpeg',
      tasks: [
        {
          app: 'live',
          hls: true,
          hlsFlags: '[hls_time=2:hls_list_size=5:hls_flags=delete_segments+append_list]',
          dash: true,
          hlsKeep: true,
          dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
          mp4Flags: '[movflags=frag_keyframe+empty_moov]',
          hlsOutPath: path.join(__dirname, "media", "live"),
          hlsOutClean: false,
          hlsOutputDir: path.join(__dirname, 'media', 'live'),
        }
      ]
    },
    webhooks: {
      publish: `${process.env.API_BASE_URL || 'http://127.0.0.1:5000/api'}/webhooks/stream/publish`,
      unpublish: `${process.env.API_BASE_URL || 'http://127.0.0.1:5000/api'}/webhooks/stream/unpublish`,
      connect: `${process.env.API_BASE_URL || 'http://127.0.0.1:5000/api'}/webhooks/stream/connect`,
      disconnect: `${process.env.API_BASE_URL || 'http://127.0.0.1:5000/api'}/webhooks/stream/disconnect`,
      play: `${process.env.API_BASE_URL || 'http://127.0.0.1:5000/api'}/webhooks/stream/play`,
      stop: `${process.env.API_BASE_URL || 'http://127.0.0.1:5000/api'}/webhooks/stream/stop`
    }
  };

  if (isProduction) {
    config.http.allow_origin = process.env.ALLOWED_ORIGINS || `https://${domain}`;
    config.rtmp.chunk_size = 128000;
    config.rtmp.ping = 60;
    config.rtmp.ping_timeout = 120;
  }

  Object.assign(config, options);

  const nms = new NodeMediaServer(config);
  const activeSessions = new Map();
  const ffmpegAvailable = await verifyFFmpeg();
  const requestCounts = new Map();

  function validateStreamKey(streamKey) {
    if (!streamKey) return false;

    if (isProduction) {
      // Must be proper format and not a common attack pattern
      const isValidFormat = typeof streamKey === 'string' && streamKey.startsWith('smc_') &&
        streamKey.length > 10 && streamKey.length < 100 && /^[a-zA-Z0-9_-]+$/.test(streamKey);

      const isMalicious = ['..', '/', '\\', '~', '$', '&', '|', ';', '`'].some(char => streamKey.includes(char));

      return isValidFormat && !isMalicious;
    }

    // Development: More permissive
    return process.env.ALLOW_ANY_STREAM === 'true' ?
      streamKey.length > 0 : streamKey.startsWith('smc_') && streamKey.length > 10;
  }

  function safeValidate(streamKey) {
    try { return validateStreamKey(streamKey); } catch (e) { return false; }
  }

  function extractStreamKey(streamPath, session = null, args = null) {
    try {
      // Try multiple methods to get the stream path
      let pathToExtract = streamPath;

      if (!pathToExtract && session) {
        pathToExtract = session.publishStreamPath || session.streamName || session.name;
      }

      if (!pathToExtract && args && args.name) return pathToExtract = args.name;


      if (!pathToExtract) {
        console.log('🔍 [DEBUG] No stream path found in:', {
          streamPath,
          sessionKeys: session ? Object.keys(session) : 'no session',
          publishStreamPath: session?.publishStreamPath,
          streamName: session?.streamName,
          args: args
        });
        return 'unknown';
      }

      // Convert to string and clean
      const pathStr = String(pathToExtract).trim();
      const parts = pathStr.split('/').filter(Boolean);
      const streamKey = parts.length > 0 ? parts[parts.length - 1] : pathStr;

      console.log('🔍 [DEBUG] Stream path extraction:', { input: pathToExtract, cleaned: pathStr, parts, extracted: streamKey });

      return streamKey || 'unknown';
    } catch (error) {
      console.error('❌ Error extracting stream key:', error);
      return 'unknown';
    }
  }

  function closeSession(session, reason = 'rejected') {
    if (!session) return;
    try {
      if (typeof session.reject === 'function') {
        session.reject();
        console.log('🛑 session.reject() called');
        return;
      }
    } catch (e) { }

    try {
      if (typeof session.stop === 'function') {
        session.stop();
        console.log('🛑 session.stop() called');
        return;
      }
    } catch (e) { }

    try {
      if (session.socket && typeof session.socket.destroy === 'function') {
        session.socket.destroy();
        console.log('🛑 session.socket.destroy() called');
        return;
      }
    } catch (e) { }

    // Last resort: mark in activeSessions so monitoring knows it's gone
    activeSessions.set(session.id, { ...(activeSessions.get(session.id) || {}), status: reason });
  }

  function rateLimit(ip, maxRequests = 100, windowMs = 60000) {
    if (!isProduction) return true;

    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = requestCounts.get(ip) || [];

    // Remove old requests
    const recentRequests = requests.filter(time => time > windowStart);
    requestCounts.set(ip, recentRequests);

    // Check if over limit
    if (recentRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    return true;
  }

  /*============= async functions ================== */
  async function verifyFFmpeg() {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync('ffmpeg -version');
      console.log('✅ FFmpeg found:', stdout.split('\n')[0]);
      return true;
    } catch (error) {
      console.error('❌ FFmpeg not found or not accessible');
      console.log('💡 Please install FFmpeg: https://ffmpeg.org/download.html');
      return false;
    }
  }

  async function triggerWebhook(event, streamKey, session, streamPath, args, additional = {}) {
    if (!streamKey || streamKey === 'unknown_stream') {
      console.log(`⚠️ [WEBHOOK] Skipping ${event} - invalid stream key`, streamKey);
      return null;
    }

    const url = config.webhooks[event];
    if (!url) { console.log(`⚠️ [WEBHOOK] No webhook configured for ${event}`); return null; }

    const baseUrl = process.env.HLS_BASE_URL || `http://localhost:${httpPort}`;
    const rtmpUrl = process.env.RTMP_SERVER_URL || `rtmp://localhost:${rtmpPort}/live`;

    const payload = {
      app: 'live',
      name: streamKey,
      streamKey,
      streamPath: streamPath || (session && session.publishStreamPath) || null,
      id: session && session.id ? session.id : (additional.id || null),
      addr: (session && session.socket && session.socket.remoteAddress) || (additional.addr || 'localhost'),
      timestamp: new Date().toISOString(),
      secret: config.auth.secret,
      args: args || additional.args || null,
      hlsUrl: `${baseUrl}/live/${streamKey}/index.m3u8`,
      rtmpUrl: `${rtmpUrl}/${streamKey}`,
      environment: isProduction ? 'production' : 'development',
      ...additional
    };

    const maxRetries = isProduction ? 5 : 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔔 [WEBHOOK] (${attempt}/${maxRetries}) Sending ${event} -> ${url} `);

        // FIXED: Better SSL handling for production
        const axiosConfig = {
          timeout: isProduction ? 15000 : 5000,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': config.auth.secret,
            'User-Agent': `RTMP-Server/${isProduction ? 'prod' : 'dev'}`
          }
        };

        // Only add HTTPS agent in production if using HTTPS
        if (isProduction && url.startsWith('https://')) {
          axiosConfig.httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });
        }

        const res = await axios.post(url, payload, axiosConfig);

        console.log(`✅ [WEBHOOK] ${event} succeeded for ${streamKey} (status=${res.status})`);
        return res.data;
      } catch (err) {
        const isNetworkError = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EPROTO', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(err.code);
        console.error(`❌ [WEBHOOK] ${event} attempt ${attempt} failed:`, isNetworkError ? err.code : err.message);
        if (err.response) {
          console.error(`📡 Response status: ${err.response.status}`, err.response.data);
        }
        if (attempt < maxRetries) {
          const backoffDelay = 1000 * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${backoffDelay}ms...`);
          await new Promise(r => setTimeout(r, backoffDelay));
        } else {
          console.log(`💤 [WEBHOOK] Giving up on ${event} for ${streamKey}`);
          await storeFailedWebhook({ event, streamKey, payload, error: err.message, code: err.code });
        }
      }
    }
    return null;
  }

  async function storeFailedWebhook(webhookData) {
    try {
      const failedPath = './failed-webhooks.json';
      let failed = [];

      if (fs.existsSync(failedPath)) {
        failed = JSON.parse(fs.readFileSync(failedPath, 'utf8') || '[]');
      }

      failed.push({
        ...webhookData,
        failedAt: new Date().toISOString()
      });

      fs.writeFileSync(failedPath, JSON.stringify(failed, null, 2));
      console.log('📝 Stored failed webhook for retry');
    } catch (error) {
      console.error('❌ Error storing failed webhook:', error);
    }
  }

  const createServerWithSecurity = (requestHandler) => {
    return (req, res) => {
      // Security headers for production
      if (isProduction) {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Rate limiting
        const clientIP = req.headers['x-forwarded-for'] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress;
        if (!rateLimit(clientIP)) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Too many requests'
          }));
          return;
        }
      }

      // CORS headers
      const allowedOrigins = isProduction ?
        [process.env.ALLOWED_ORIGINS || `https://${domain}`] :
        ['*'];

      const origin = req.headers.origin;
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      requestHandler(req, res);
    };
  };

  if (!ffmpegAvailable) {
    console.log('⚠️ HLS streaming will not work without FFmpeg');
  }

  /* --- NMS event handlers --- */
  nms.on('preConnect', (session, args) => {
    console.log('🔌 [OBS Connecting]', `id=${session?.id}`, `ip=${args?.ip || 'unknown'}`);
  });

  nms.on('postConnect', (session, args) => {
    console.log('✅ [OBS Connected]', `id=${session?.id}`, `ip=${args?.ip || 'unknown'}`);
    if (session) session._status = 'connected';
  });

  nms.on('doneConnect', (session, args) => {
    console.log('❌ [OBS Disconnected]', `id=${session?.id}`, `ip=${args?.ip || 'unknown'}`);
  });

  nms.on('prePublish', (session, streamPath, args) => {
    try {
      console.log('🎥 [prePublish]', `id=${session?.id}`, `streamPath=${streamPath}`, `args=${JSON.stringify(args)}`);

      const actualPath = streamPath || session.streamName || session.publishStreamPath || '';
      const streamKey = extractStreamKey(actualPath, session, args);
      if (!safeValidate(streamKey)) {
        console.log('❌ [INVALID STREAM KEY] Rejecting stream:', streamKey);
        closeSession(session, 'rejected-invalid-key');
        return;
      }

      // This tells NMS that authentication passed
      if (session && typeof session.accept === 'function') {
        session.accept();
      }

      // mark active session
      const now = Date.now();
      activeSessions.set(session.id, {
        id: session.id,
        publish: { isActive: true, streamPath: actualPath },
        streamKey,
        connectTime: now,
        players: [],
        args: args || null
      });

      // attach friendly properties for later
      session._status = 'publishing';
      session._streamKey = streamKey;
      session._streamPath = actualPath;

      console.log('✅ [STREAM KEY VALID] Allowing stream:', streamKey);
    } catch (err) {
      console.error('❌ [prePublish] error', err.message);
    }
  });

  nms.on('postPublish', async (session, streamPath, args) => {
    try {
      console.log('📹 [postPublish]', `id=${session?.id}`, `streamPath=${streamPath}`, `args=${JSON.stringify(args)}`);

      const actualPath = streamPath || session?.publishStreamPath || session.streamName || '';
      const streamKey = extractStreamKey(actualPath, session, args);
      const baseUrl = process.env.HLS_BASE_URL || `http://127.0.0.1:${httpPort}`;

      if (!safeValidate(streamKey)) {
        console.log('❌ [POST-PUBLISH] Invalid stream key — stream NOT started:', streamKey);
        return;
      }


      console.log('='.repeat(60));
      console.log('🎬 ✅ OBS LIVE STREAM STARTED SUCCESSFULLY!');
      console.log('📹 Stream Key:', streamKey);
      console.log('🌐 HLS URL:', `${baseUrl}/live/${streamKey}/index.m3u8`);
      console.log('='.repeat(60));

      // send webhook (publish)
      await triggerWebhook('publish', streamKey, session, actualPath, args);

      // update activeSessions (safe overwrite)
      activeSessions.set(session.id, {
        ...(activeSessions.get(session.id) || {}),
        id: session.id,
        publish: { isActive: true, streamPath: actualPath || null },
        streamKey,
        connectTime: Date.now(),
        players: activeSessions.get(session.id)?.players || [],
        args: args || null
      });

    } catch (err) {
      console.error('❌ [postPublish] error', err.message);
    }
  });

  nms.on('donePublish', async (session, streamPath, args) => {
    try {
      console.log('⏹️ [OBS Stream Ended]', session?.id, `streamPath=${streamPath}`, `args=${JSON.stringify(args)}`);

      const actualPath = streamPath || session?.publishStreamPath || session.streamName || '';
      const streamKey = extractStreamKey(actualPath, session, args);

      // mark publish as inactive
      const info = activeSessions.get(session.id) || {};
      info.publish = { ...(info.publish || {}), isActive: false };
      activeSessions.set(session.id, info);

      // triggers unpublish webhook
      await triggerWebhook('unpublish', streamKey, session, actualPath, args);

      // clean-up session from map after a short delay
      setTimeout(() => activeSessions.delete(session.id), 5000);
    } catch (err) {
      console.error('❌ [donePublish] error', err.message);
    }
  });

  nms.on('prePlay', (session, streamPath, args) => {
    try {
      console.log('📺 [Pre-Play]', session?.id, `streamPath=${streamPath}`, `args=${JSON.stringify(args)}`);

      const actualPath = streamPath || session?.publishStreamPath || session.streamName || '';
      const streamKey = extractStreamKey(actualPath, session, args);

      // increment players that list on activeSessions if present
      const sessions = Array.from(activeSessions.values());
      const s = sessions.find(x => x.streamKey === streamKey);
      if (s) {
        s.players = s.players || [];
        s.players.push(session.id);
        activeSessions.set(s.id, s);
      }
    } catch (e) { }
  });

  nms.on('postPlay', (session, streamPath, args) => {
    try {
      const streamKey = extractStreamKey(streamPath, session, args);
      console.log('📺 [Post-Play]', session?.id, `streamKey=${streamKey}`, `args=${JSON.stringify(args)}`);
    } catch (e) { }
  });

  nms.on('donePlay', (session, streamPath, args) => {
    try {

      const actualPath = streamPath || session?.publishStreamPath || session.streamName || '';
      const streamKey = extractStreamKey(actualPath, session, args);

      console.log('👋 [Viewer Disconnected]', session?.id, `streamKey=${streamKey}`, `args=${JSON.stringify(args)}`);
      // remove player from activeSessions
      const sessions = Array.from(activeSessions.values());
      const s = sessions.find(x => x.streamKey === streamKey);
      if (s) {
        s.players = (s.players || []).filter(pid => pid !== session.id);
        activeSessions.set(s.id, s);
      }
    } catch (e) { }
  });

  nms.on('error', (session, args) => {
    console.error('❌ [RTMP Error]', session && session.id, args);
  });

  nms.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  try {
    nms.run();
    console.log('✅ NodeMediaServer started successfully');
  } catch (error) {
    console.error('❌ Failed to start NodeMediaServer:', error);
    process.exit(1);
  }

  // Streams API Server for a quick status
  const streamsServer = http.createServer(createServerWithSecurity((req, res) => {

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === '/api/streams' && req.method === 'GET') {
      try {
        const sessions = Array.from(activeSessions.values());
        const activeStreams = sessions.filter(s => s.publish && s.publish.isActive);

        const baseUrl = process.env.HLS_BASE_URL || `http://localhost:${httpPort}`;


        const streams = activeStreams.map(stream => ({
          id: stream.id,
          streamKey: stream.streamKey,
          streamPath: stream.publish.streamPath,
          startTime: stream.connectTime,
          subscribers: stream.players ? stream.players.length : 0,
          hlsUrl: `${baseUrl}/live/${stream.streamKey}/index.m3u8`
        }));

        const response = {
          success: true,
          server: {
            environment: isProduction ? 'production' : 'development',
            domain: domain,
            rtmpPort,
            hlsPort: httpPort,
            apiPort: apiPort
          },
          live: streams.reduce((acc, stream) => {
            acc[stream.streamKey] = {
              subscribers: stream.subscribers,
              startTime: stream.startTime,
              hlsUrl: stream.hlsUrl
            };
            return acc;
          }, {}),
          streams
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error in /api/streams:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: isProduction ? 'Internal server error' : error.message
        }));
      }
      return;
    }

    if (req.url === '/api/hls-status' && req.method === 'GET') {
      try {
        const liveDir = path.join(__dirname, 'media', 'live');
        const streams = [];
        const baseUrl = process.env.HLS_BASE_URL || `http://localhost:${httpPort}`;


        if (fs.existsSync(liveDir)) {
          const items = fs.readdirSync(liveDir, { withFileTypes: true });
          items.forEach(item => {
            if (item.isDirectory()) {
              const streamKey = item.name;
              const m3u8Path = path.join(liveDir, streamKey, 'index.m3u8');
              const hasM3U8 = fs.existsSync(m3u8Path);

              streams.push({
                streamKey,
                hasM3U8,
                hlsUrl: `${baseUrl}/live/${streamKey}/index.m3u8`,
                lastModified: hasM3U8 ? fs.statSync(m3u8Path).mtime : null
              });
            }
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          hlsPort: httpPort,
          mediaDir: liveDir,
          streams,
          activeSessions: Array.from(activeSessions.values()).map(s => ({
            id: s.id,
            streamKey: s.streamKey,
            isActive: s.publish.isActive
          }))
        }));
      } catch (error) {
        console.error('Error in /api/hls-status:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  }));

  // Enhanced HLS file server
  const hlsServer = http.createServer(createServerWithSecurity((req, res) => {
    try {

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Handle HLS manifest requests
      if (req.url.match(/\.m3u8$/) && req.method === 'GET') {
        const streamKey = req.url.split('/').pop().replace('.m3u8', '');

        if (!safeValidate(streamKey)) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Invalid stream key');
          return;
        }
        const m3u8Path = path.join(__dirname, 'media', 'live', streamKey, 'index.m3u8');

        console.log(`📁 HLS request: ${streamKey} -> ${m3u8Path}`);
        console.log(`📁 Directory exists: ${fs.existsSync(path.dirname(m3u8Path))}`);
        console.log(`📁 File exists: ${fs.existsSync(m3u8Path)}`);

        if (fs.existsSync(m3u8Path)) {
          const m3u8Content = fs.readFileSync(m3u8Path, 'utf8');
          res.writeHead(200, {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache, max-age=0',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(m3u8Content);
          console.log(`✅ Served HLS for: ${streamKey}`);
        } else {
          console.log(`❌ HLS not found: ${m3u8Path}`);
          const dirPath = path.dirname(m3u8Path);
          if (fs.existsSync(dirPath)) {
            console.log(`📁 Directory contents:`, fs.readdirSync(dirPath));
          }
          res.writeHead(404, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          });
          res.end('Stream not ready or not found');
        }
        return;
      }

      // Handle TS segment requests
      if (req.url.match(/\.ts$/) && req.method === 'GET') {
        const urlParts = req.url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const streamKey = urlParts[urlParts.length - 2];

        if (!safeValidate(streamKey)) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Invalid stream key');
          return;
        }
        const tsPath = path.join(__dirname, 'media', 'live', streamKey, filename);

        if (fs.existsSync(tsPath)) {
          const tsContent = fs.readFileSync(tsPath);
          res.writeHead(200, {
            'Content-Type': 'video/mp2t',
            'Cache-Control': 'max-age=3600',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(tsContent);
        } else {
          res.writeHead(404, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
          });
          res.end('Segment not found');
        }
        return;
      }

      // Handle root requests
      if ((req.url === '/' || req.url === '/health' || req.url === '/status') && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        });

        const baseUrl = process.env.HLS_BASE_URL || `http://127.0.0.1:${httpPort}`;
        const rtmpUrl = `${process.env.RTMP_BASE_URL || `rtmp://localhost:${rtmpPort}`}/live`;
        const apiUrl = process.env.API_BASE_URL || `http://localhost:${apiPort}`;

        const html = `
        <html>
          <head><title>RTMP/HLS Server - Status: RUNNING</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>✅ RTMP/HLS Streaming Server - RUNNING</h1>
            <p><strong>Environment:</strong> ${isProduction ? 'Production' : 'Development'}</p>
            <p><strong>RTMP URL:</strong> ${rtmpUrl}</p>
            <p><strong>HLS Base URL:</strong> ${baseUrl}/live/{streamkey}.m3u8</p>
            <p><strong>API Status:</strong> <a href="${apiUrl}/api/hls-status">HLS Status</a></p>
            <p><strong>Streams API:</strong> <a href="${apiUrl}/api/streams">Active Streams</a></p>
            <p><strong>FFmpeg:</strong> ${ffmpegAvailable ? '✅ Available' : '❌ Not Found'}</p>
            <p><strong>Active Sessions:</strong> ${Array.from(activeSessions.values()).filter(s => s.publish.isActive).length}</p>
            <hr>
            <h3>Quick Test URLs:</h3>
            <ul>
              <li><a href="/live/test.m3u8">Test HLS Manifest</a></li>
              <li><a href="${apiUrl}/api/streams">Streams API</a></li>
              <li><a href="${apiUrl}/api/hls-status">HLS Status</a></li>
            </ul>
          </body>
        </html>
      `;
        res.end(html);
        return;
      }

      // Handle /live/ directory requests
      if (req.url.startsWith('/live/') && req.method === 'GET') {
        const streamKey = req.url.split('/')[2]?.replace('.m3u8', '');

        if (streamKey && safeValidate(streamKey)) {
          const m3u8Path = path.join(__dirname, 'media', 'live', streamKey, 'index.m3u8');

          if (fs.existsSync(m3u8Path)) {
            const m3u8Content = fs.readFileSync(m3u8Path, 'utf8');
            res.writeHead(200, {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Cache-Control': 'no-cache, max-age=0',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(m3u8Content);
            console.log(`✅ Served HLS via /live/ path: ${streamKey}`);
          } else {
            res.writeHead(404, {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*'
            });
            res.end('Stream not found');
          }
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('Not found');

    } catch (error) {
      console.error('❌ HLS server error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      res.end('Server error');
    }
  }));

  streamsServer.listen(apiPort, '0.0.0.0', () => {
    console.log(`📊 Streams API server running on :${apiPort}`);
  });

  hlsServer.listen(httpPort, '0.0.0.0', () => {
    console.log(`🎬 HLS Server running on :${httpPort}`);
  });

  // Periodic live sessions monitoring
  const monitorInterval = setInterval(() => {
    try {
      const sessions = Array.from(activeSessions.values());
      const activeStreams = sessions.filter(session => session.publish && session.publish.isActive && session.publish.streamPath);

      if (activeStreams.length > 0) {
        console.log('📊 [STREAM STATS] Active streams:', activeStreams.length);
        activeStreams.forEach(stream => {
          const streamKey = extractStreamKey(stream.publish.streamPath);
          console.log(`✅ - Path: ${stream.publish.streamPath}`);
          console.log(`📹 - Key: ${streamKey}`);
          console.log(`🔗 - Session ID: ${stream.id}`);
          console.log(`🌐 - Clients: ${stream.players ? stream.players.length : 0}`);
          console.log('   ──────────────────────────');
        });
      } else {
        console.log('ℹ️ No active streams at the moment.');
      }
    } catch (error) {
      console.error('❌ Error in stream monitoring:', error.message);
    }
  }, 5 * 60 * 1000);

  const webhookRetryInterval = setInterval(() => {
    retryFailedWebhooks();
  }, 5 * 60 * 1000);

  const baseUrl = process.env.HLS_BASE_URL || `http://127.0.0.1:${httpPort}`;
  const rtmpUrl = `${process.env.RTMP_BASE_URL || `rtmp://localhost:${rtmpPort}`}/live`;
  const apiUrl = process.env.API_BASE_URL || `http://127.0.0.1:${apiPort}`;

  console.log('\n' + '='.repeat(60));
  console.log(isProduction ? '🚀 PRODUCTION RTMP SERVER STARTED' : '🔧 DEVELOPMENT RTMP SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`🎥 RTMP: ${rtmpUrl}`);
  console.log(`📺 HLS:  ${baseUrl}/live/{streamkey}/index.m3u8`);
  console.log(`📊 API:   ${apiUrl}/streams`);
  console.log(`🔍 STATUS: ${apiUrl}/hls-status`);
  console.log(`🔐 Authentication: ${isProduction ? 'Enabled' : 'Disabled'}`);
  console.log(`🔧 Environment: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`🔗 Webhooks: ${!!config.webhooks.publish}`);
  console.log(`🔧 FFmpeg: ${ffmpegAvailable ? 'Available' : 'Not Found'}`);
  console.log('🚀 Ready for OBS streaming...');
  console.log('='.repeat(60));
  console.log('\n📋 OBS SETUP:');
  console.log(`Server: ${rtmpUrl}`);
  console.log(`Stream Key Example: smc_<your_stream_key_here>`);
  console.log('='.repeat(60) + '\n');

  // Handle graceful shutdown
  let isShuttingDown = false;
  const gracefulShutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log('\n🛑 Shutting down RTMP server gracefully...');
    try {
      const sessions = nms.getSessions ? (nms.getSessions() || []) : [];
      console.log('📊 Active sessions to close:', sessions.length);
    } catch (error) {
      console.log('📊 Active sessions: Unable to count');
    }

    clearInterval(monitorInterval);

    try {
      if (nms && typeof nms.stop === 'function') {
        nms.stop();
        console.log('✅ RTMP server stopped successfully');
      }
    } catch (error) {
      console.error('❌ Error stopping RTMP server:', error.message);
    }

    setTimeout(() => {
      console.log('🚪 Exiting process...');
      process.exit(0);
    }, 1000);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGUSR2', gracefulShutdown);
  process.on('SIGTERM', () => { clearInterval(webhookRetryInterval) });
  process.on('SIGINT', () => { clearInterval(webhookRetryInterval) });

  return nms;
}

if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Starting in PRODUCTION mode');
  process.env.ALLOW_ANY_STREAM = 'false';
} else {
  console.log('🔧 Starting in DEVELOPMENT mode');
  process.env.ALLOW_ANY_STREAM = 'true';
}

export const startRtmp = async () => {
  try {
    console.log('🚀 Starting RTMP Server...');

    // Check if ports are available
    const ports = [1935, 8000, 8001];
    for (const port of ports) {
      const available = await checkPort(port);
      if (!available) {
        console.log(`⚠️ Port ${port} is already in use`);
      } else {
        console.log(`✅ Port ${port} is available`);
      }
    }

    // Start the server
    const nms = await startNodeMediaServer();

    console.log('✅ RTMP Server started successfully!');
    console.log('📍 Available endpoints:');
    console.log(`   - HLS Server: http://localhost:8000/`);
    console.log(`   - Streams API: http://localhost:8001/api/streams`);
    console.log(`   - HLS Status: http://localhost:8001/api/hls-status`);

    return nms;
  } catch (error) {
    console.error('❌ Failed to start RTMP Server:', error);
    console.log('⚠️ RTMP server failed to start, continuing without it');
    return null;
  }
};

