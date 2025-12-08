// SermonsPage.jsx (patched)
// keep your existing imports, plus uuid
import { useState, useEffect, useRef } from "react";
import { sermonService } from '../services/apiService';
import Loader, { ContentLoader } from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { Sermon } from '../models/Sermon';
import useAuth from '../hooks/useAuth';
import videojs from "video.js";
import "video.js/dist/video-js.css";
import ChatPanel from "../components/chatPanel";
import { useLiveStatus } from "../hooks/useLiveStatus";
import { v4 as uuidv4 } from 'uuid';

const SermonsPage = () => {
  const alert = useAlert();
  const { user } = useAuth();
  const [selectedSermon, setSelectedSermon] = useState(null);
  const [showSermonModal, setShowSermonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sermonFilter, setSermonFilter] = useState('all');
  const [sermons, setSermons] = useState([]);
  const [favoriteSermons, setFavoriteSermons] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sermonStats, setSermonStats] = useState(null);
  const { liveStatus, refreshLiveStatus } = useLiveStatus();
  const [editForm, setEditForm] = useState({
    title: '',
    speaker: '',
    description: '',
    category: 'faith',
    videoUrl: '',
    imageUrl: '',
    isLive: false,
    streamKey: ''
  });

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const isAuthenticated = user?.isLoggedIn;

  useEffect(() => {
    document.title = "SMC: - Sermons | St. Michael's & All Angels Church | Ifite-Awka";
    fetchSermons();
    fetchCategories();
    if (isAuthenticated) {
      fetchUserFavorites();
    }
    if (isAdmin) {
      fetchSermonStats();
    }
    // refresh live status every 15s (hook may already do this — safe)
    const t = setInterval(() => refreshLiveStatus(), 15000);
    return () => clearInterval(t);
  }, [isAuthenticated, isAdmin]);

  // When we receive a liveStatus from the API, mark the matching sermon live
  useEffect(() => {
    if (!liveStatus) return;
    const key = liveStatus.streamKey || liveStatus.streamkey || liveStatus.data?.streamKey;
    if (!key) return;
    setSermons(prev => prev.map(s => {
      // stable matching: check streamKey or rtmpConfig.streamKey
      const sKey = s.streamKey || (s.rtmpConfig && s.rtmpConfig.streamKey) || s.stream?.streamKey;
      if (sKey === key) {
        return { ...s, isLive: true, liveStreamStatus: 'live' };
      }
      return s;
    }));
  }, [liveStatus]);

  const fetchSermons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await sermonService.getAll();
      console.log('📥 Sermons API Response:', response);

      let sermonsData = [];

      // Normalize possible response shapes
      if (Array.isArray(response)) {
        sermonsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        sermonsData = response.data;
      } else if (response?.sermons && Array.isArray(response.sermons)) {
        sermonsData = response.sermons;
      } else if (response?.data?.sermons && Array.isArray(response.data.sermons)) {
        sermonsData = response.data.sermons;
      } else if (response?.success && Array.isArray(response.data)) {
        sermonsData = response.data;
      } else {
        console.warn('⚠️ Unexpected sermons response structure:', response);
        sermonsData = [];
      }

      const normalizedSermons = sermonsData.map(sermon => new Sermon(sermon));
      setSermons(normalizedSermons);
      console.log('✅ Normalized sermons:', normalizedSermons);

    } catch (error) {
      console.error('❌ Error fetching sermons:', error);
      setError('Failed to load sermons. Please try again later.');
      alert.error('Failed to load sermons. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await sermonService.getCategories();
      console.log('📥 Categories Response:', response);

      let categoriesData = [];

      if (Array.isArray(response)) {
        categoriesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response?.categories && Array.isArray(response.categories)) {
        categoriesData = response.categories;
      } else if (response?.success && Array.isArray(response.data)) {
        categoriesData = response.data;
      } else {
        console.warn('⚠️ Unexpected categories response structure:', response);
        categoriesData = ['faith', 'hope', 'love', 'sunday-service', 'bible-study'];
      }

      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategories(['faith', 'hope', 'love', 'sunday-service', 'bible-study']);
    }
  };

  const fetchUserFavorites = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await sermonService.getFavorites();
      console.log('📥 Favorites Response:', response);

      let favoritesData = [];

      if (Array.isArray(response)) {
        favoritesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        favoritesData = response.data;
      } else if (response?.favorites && Array.isArray(response.favorites)) {
        favoritesData = response.favorites;
      } else if (response?.success && Array.isArray(response.data)) {
        favoritesData = response.data;
      }

      const favoriteIds = favoritesData.map(fav => {
        return fav.sermonId || fav._id || fav.itemId || fav.id;
      }).filter(id => id);

      setFavoriteSermons(new Set(favoriteIds));
    } catch (error) {
      console.error('❌ Error fetching favorites:', error);
    }
  };

  const fetchSermonStats = async () => {
    if (!isAdmin) return;

    try {
      const response = await sermonService.getStats();
      console.log('📥 Stats Response:', response);

      let statsData = null;

      if (response?.data) {
        statsData = response.data;
      } else if (response?.stats) {
        statsData = response.stats;
      } else if (response?.success && response.data) {
        statsData = response.data;
      } else if (response) {
        statsData = response;
      }

      setSermonStats(statsData);
    } catch (error) {
      console.error('❌ Error fetching sermon stats:', error);
    }
  };

  const handleEditSermon = (sermon) => {
    setEditForm({
      _id: sermon._id || sermon.id,
      title: sermon.title || '',
      speaker: sermon.speaker || '',
      description: sermon.description || '',
      category: sermon.category || 'faith',
      videoUrl: sermon.videoUrl || '',
      imageUrl: sermon.imageUrl || '',
      isLive: !!sermon.isLive,
      streamKey: sermon.streamKey || (sermon.rtmpConfig && sermon.rtmpConfig.streamKey) || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteSermon = async (sermonId) => {
    alert.info('Are you sure you want to delete this sermon?', {
      confirm: async () => {
        try {
          await sermonService.delete(sermonId);
          setSermons(sermons.filter(s => (s._id || s.id) !== sermonId));
          alert.success('Sermon deleted successfully.');
        } catch (error) {
          console.error('❌ Error deleting sermon:', error);
          if (error.response?.status === 403) {
            alert.error('Permission denied. Only admins can delete sermons.');
          } else {
            alert.error('Failed to delete sermon');
          }
        }
      }
    });
  };

  // unified create/update handler; admin can set isLive and streamKey
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = { ...editForm };

      // Ensure streamKey if isLive
      if (payload.isLive && !payload.streamKey) {
        // prefer server helper
        if (sermonService.generateKey) {
          const { data } = await sermonService.generateKey();
          payload.streamKey = data?.streamKey || data?.key || data;
        } else {
          // fallback client-side key (stable)
          payload.streamKey = `smc_${uuidv4()}`;
        }
      }

      let response;
      if (payload._id) {
        // Update existing
        response = await sermonService.update(payload._id, payload);
      } else {
        // Create new sermon
        response = await sermonService.create({
          ...payload,
          date: payload.date || new Date().toISOString()
        });
      }

      // If admin requested to start live immediately, prefer dedicated endpoint
      const savedSermonData = response?.data || response?.sermon || response || null;
      const savedSermon = new Sermon(savedSermonData);

      // If admin marked isLive true and backend has startLive, call it
      if (payload.isLive) {
        if (sermonService.startLive) {
          try {
            // pass minimal info; backend will validate and keep single-source-of-truth
            await sermonService.startLive(savedSermon._id || savedSermon.id, {
              streamKey: payload.streamKey
            });
          } catch (e) {
            // fallback: update sermon 'isLive' if startLive not accepted
            console.warn('startLive failed, falling back to update:', e.message);
            await sermonService.update(savedSermon._id || savedSermon.id, {
              isLive: true,
              streamKey: payload.streamKey
            });
          }
        } else {
          // fallback: update sermon to set isLive
          await sermonService.update(savedSermon._id || savedSermon.id, {
            isLive: true,
            streamKey: payload.streamKey
          });
        }
      }

      // Refresh list
      await fetchSermons();

      setShowEditModal(false);
      setEditForm({
        title: '',
        speaker: '',
        description: '',
        category: 'faith',
        videoUrl: '',
        imageUrl: '',
        isLive: false,
        streamKey: ''
      });
      alert.success(`Sermon ${payload._id ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('❌ Error saving sermon:', error);
      if (error.response?.status === 403) {
        alert.error('Permission denied. Only admins can manage sermons.');
      } else {
        alert.error('Failed to save sermon');
      }
    }
  };

  const handleAddToFavorites = async (sermonId) => {
    if (!isAuthenticated) {
      alert.info('Please log in to add to favorites');
      return;
    }

    try {
      if (favoriteSermons.has(sermonId)) {
        await sermonService.removeFavorite(sermonId);
        setFavoriteSermons(prev => {
          const newSet = new Set(prev);
          newSet.delete(sermonId);
          return newSet;
        });
        alert.success('Removed from favorites!');
      } else {
        await sermonService.addFavorite(sermonId);
        setFavoriteSermons(prev => new Set(prev).add(sermonId));
        alert.success('Added to favorites!');
      }
    } catch (error) {
      console.error('❌ Error updating favorites:', error);
      alert.error('Failed to update favorites');
    }
  };

  const handleSermonPlay = (sermon) => {
    setSelectedSermon(sermon);
    setShowSermonModal(true);
  };

  // Filter sermons based on selected category
  const filteredSermons = sermonFilter === 'all' ? sermons : sermons.filter(sermon => sermon.category === sermonFilter);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return <ContentLoader type="spinner" text="Loading sermons..." />;
  }

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Sermons</h1>
          <p className="text-xl max-w-2xl mx-auto">Watch or listen to recent messages from our pastors</p>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setEditForm({
                    title: '',
                    speaker: '',
                    description: '',
                    category: 'faith',
                    videoUrl: '',
                    imageUrl: '',
                    isLive: false,
                    streamKey: ''
                  });
                  setShowEditModal(true);
                }}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>Add New Sermon
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchSermons}
              className="btn btn-outline underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Live Stream Banner */}
      <LiveStreamSection
        liveStatus={liveStatus}
        user={user}
        onRetry={refreshLiveStatus}
      />

      {/* Sermons Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filter Tabs */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            <button
              className={`px-4 py-2 rounded-full transition-colors ${sermonFilter === 'all' ? 'bg-[#FF7E45] text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => setSermonFilter('all')}
            >
              All Sermons
            </button>
            {Array.isArray(categories) && categories.map(category => (
              <button
                key={String(category)}
                className={`px-4 py-2 rounded-full transition-colors ${sermonFilter === category
                  ? 'bg-[#FF7E45] text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                onClick={() => setSermonFilter(category)}
              >
                {typeof category === 'string'
                  ? category.charAt(0).toUpperCase() + category.slice(1)
                  : String(category)
                }
              </button>
            ))}
          </div>

          {/* Sermons Count */}
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              Showing {filteredSermons.length} sermon{filteredSermons.length !== 1 ? 's' : ''}
              {sermonFilter !== 'all' && ` in ${sermonFilter}`}
            </p>
            {liveStatus?.isLive && (
              <div className="mt-2 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Stream Active
              </div>
            )}
          </div>

          {/* Sermons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSermons.map((sermon) => (
              <SermonCard
                key={sermon._id || sermon.streamKey || sermon.id}
                sermon={sermon}
                isAdmin={isAdmin}
                isFavorite={favoriteSermons.has(sermon._id) || favoriteSermons.has(sermon.id)}
                onEdit={handleEditSermon}
                onDelete={handleDeleteSermon}
                onFavorite={handleAddToFavorites}
                onPlay={handleSermonPlay}
                isAuthenticated={isAuthenticated}
                formatDate={formatDate}
                isLive={sermon.isLive && sermon.liveStreamStatus === 'live'}
              />
            ))}
          </div>

          {filteredSermons.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-sad-tear text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">
                {sermonFilter === 'all'
                  ? 'No sermons available yet.'
                  : `No sermons found in the ${sermonFilter} category.`
                }
              </p>
              {isAdmin && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="mt-4 bg-[#FF7E45] text-white px-6 py-2 rounded-lg hover:bg-[#FFA76A] transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>Add First Sermon
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Sermon Modal */}
      {showSermonModal && selectedSermon && (
        <SermonModal
          sermon={selectedSermon}
          isFavorite={favoriteSermons.has(selectedSermon._id) || favoriteSermons.has(selectedSermon.id)}
          onClose={() => setShowSermonModal(false)}
          onFavorite={handleAddToFavorites}
          isAuthenticated={isAuthenticated}
          formatDate={formatDate}
        />
      )}

      {/* Edit Sermon Modal */}
      {showEditModal && (
        <EditSermonModal
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          categories={categories}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

/* ----------------------------
   LiveStreamSection (unchanged concept)
   - uses liveStatus.liveStreamUrl explicitly
   - improved player lifecycle and error UX
   ---------------------------- */
const LiveStreamSection = ({ liveStatus, user, onRetry }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    if (liveStatus?.isLive && liveStatus.liveStreamUrl && !isInitialized) {
      initializeVideoJS();
    } else if (!liveStatus?.isLive && playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
      setIsInitialized(false);
      setIsPlaying(false);
      setVideoError(false);
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStatus?.isLive, liveStatus?.liveStreamUrl]);

  const initializeVideoJS = () => {
    if (!videoRef.current || !liveStatus?.liveStreamUrl) return;

    try {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      const isHLS = liveStatus.liveStreamUrl.includes('.m3u8');
      const videoOptions = {
        controls: true,
        autoplay: true,
        muted: true,
        playsinline: true,
        fluid: true,
        liveui: true,
        preload: 'auto',
        sources: [{
          src: liveStatus.liveStreamUrl,
          type: isHLS ? 'application/x-mpegURL' : 'video/mp4'
        }],
        html5: {
          vhs: {
            overrideNative: !videojs.browser.IS_SAFARI,
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
          }
        }
      };

      const videoPlayer = videojs(videoRef.current, videoOptions, function () {
        setIsInitialized(true);
        setVideoError(false);

        const playPromise = this.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(() => {
            setUserInteracted(false);
          });
        }

        this.on('play', () => { setIsPlaying(true); setUserInteracted(true); });
        this.on('pause', () => setIsPlaying(false));
        this.on('error', () => { setVideoError(true); });
        this.on('loadeddata', () => setVideoError(false));
      });

      playerRef.current = videoPlayer;

    } catch (error) {
      console.error('❌ Error initializing live stream player:', error);
      setVideoError(true);
    }
  };

  const handlePlayClick = () => {
    if (playerRef.current) {
      setUserInteracted(true);
      playerRef.current.play().catch(err => console.warn('Play failed:', err));
    }
  };

  const handleRetryStream = () => {
    setVideoError(false);
    setIsInitialized(false);
    setUserInteracted(false);

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    setTimeout(() => initializeVideoJS(), 500);
  };

  // keep your CSS (omitted for brevity)
  const videoPlayerStyle = `
    .custom-video-js .vjs-control-bar {
      background: linear-gradient(to top, #00000024 0%, transparent 100%);
    }
    .custom-video-js .vjs-play-progress,
    .custom-video-js .vjs-volume-level {
      background-color: #FF7E45;
    }
    .custom-video-js .vjs-big-play-button {
      background-color: rgba(255, 126, 69, 0.9);
      border: none;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      line-height: 80px;
      font-size: 2.5em;
    }
    .custom-video-js .vjs-big-play-button:hover {
      background-color: rgba(255, 126, 69, 1);
    }
    .live-indicator {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #e74c3c;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 5;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .play-overlay:hover {
      opacity: 1;
    }
    .play-overlay-button {
      width: 80px;
      height: 80px;
      background: rgba(255, 126, 69, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2em;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;
  return (
    <section className="bg-[#333333e8] text-white py-8">
      <style>{videoPlayerStyle}</style>
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3">
            <div className="bg-black rounded-lg overflow-hidden shadow-lg relative">
              <div className="relative w-full aspect-video bg-black">
                {liveStatus?.isLive && liveStatus.liveStreamUrl ? (
                  <>
                    <div className="live-indicator">
                      <div className="live-dot"></div>LIVE
                    </div>

                    <div data-vjs-player className="w-full h-full relative">
                      <video
                        ref={videoRef}
                        id="live-stream-player"
                        className="video-js vjs-default-skin vjs-big-play-centered custom-video-js w-full h-full"
                        playsInline
                        controls
                        src={`http://${hlsPort}/live/${streamKey}/index.m3u8`}
                        preload="auto"
                      >
                        <p className="vjs-no-js">
                          To view this video please enable JavaScript, and consider upgrading to a
                          web browser that supports HTML5 video
                        </p>
                      </video>

                      {!isPlaying && (
                        <div className="play-overlay" onClick={handlePlayClick}>
                          <div className="play-overlay-button">
                            <i className="fas fa-play"></i>
                          </div>
                        </div>
                      )}
                    </div>

                    {videoError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-20">
                        <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                        <h3 className="text-xl font-bold mb-2">Stream Error</h3>
                        <p className="text-gray-300 mb-4 text-center px-4">
                          Unable to load the live stream. The stream might be offline or experiencing technical issues.
                        </p>
                        <div className="flex gap-3">
                          <button onClick={handleRetryStream} className="bg-[#FF7E45] px-4 py-2 rounded">Retry Stream</button>
                          <button onClick={onRetry} className="bg-blue-500 px-4 py-2 rounded">Refresh Status</button>
                        </div>
                      </div>
                    )}

                    {!userInteracted && !videoError && (
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm">
                        Click the play button to start watching
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-center px-4">
                    <i className="fas fa-video text-5xl text-gray-400 mb-4"></i>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">Service Starts Soon</h3>
                    <p className="text-gray-300 text-sm md:text-base">
                      {liveStatus?.offlineMessage || 'No live stream currently active. Check back later for our next service.'}
                    </p>
                    <button onClick={onRetry} className="mt-4 bg-[#FF7E45] px-4 py-2 rounded">Check for Live Stream</button>
                  </div>
                )}
              </div>
            </div>

            {liveStatus?.isLive && (
              <div className="mt-4 bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-bold mb-2">{liveStatus?.currentTitle || 'Live Church Service'}</h2>
                <p className="text-gray-300 mb-2">{liveStatus?.currentSpeaker || 'Church Service'}</p>
                <p className="text-sm text-gray-400">{liveStatus?.currentDescription || 'Join us for worship and teaching'}</p>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center"><i className="fas fa-eye mr-1"></i>{liveStatus?.viewers || 0} viewers</span>
                    <span className="flex items-center"><i className="fas fa-clock mr-1"></i>{liveStatus?.duration || 'Live'}</span>
                    {liveStatus?.isLive && (<span className="flex items-center text-green-400"><i className="fas fa-circle mr-1"></i>Live Now</span>)}
                  </div>

                  <div className="flex space-x-2">
                    <button className="bg-[#FF7E45] ..." onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: liveStatus?.currentTitle || 'Live Stream', text: liveStatus?.currentDescription || 'Join our live stream', url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Stream link copied to clipboard!');
                      }
                    }}>
                      <i className="fas fa-share-alt mr-2"></i> Share
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-1/3">
            <ChatPanel label="Live Chat" user={user} />
            {!user && (
              <div className="p-4 border-t border-gray-700 text-center">
                <p className="text-sm text-gray-400">Please <a href="/login" className="text-[#FF7E45] hover:underline">login</a> to participate in chat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* SermonCard, SermonModal, EditSermonModal - unchanged except EditSermonModal now supports streamKey and isLive input.
   I include only EditSermonModal code because it's important for the "create live sermon" flow.
*/

const SermonCard = ({ sermon, isAdmin, isFavorite, onEdit, onDelete, onFavorite, onPlay, isAuthenticated, formatDate }) => {
  const sermonId = sermon._id || sermon.id;
  return (
    <div className="sermon-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative cursor-pointer" onClick={() => onPlay(sermon)}>
        <img src={sermon.imageUrl || '/default-thumbnail.jpg'} alt={sermon.title} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-[#FF7E45] text-white rounded-full flex items-center justify-center">
            <i className="fas fa-play text-2xl"></i>
          </div>
        </div>
        {isAdmin && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(sermon); }} className="bg-blue-500 text-white p-1 rounded"><i className="fas fa-edit text-sm"></i></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(sermonId); }} className="bg-red-500 text-white p-1 rounded"><i className="fas fa-trash text-sm"></i></button>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-500 mb-2">{formatDate(sermon.date)}</div>
            <h3 className="text-xl font-bold mb-2">{sermon.title}</h3>
            <p className="text-gray-600">{sermon.speaker}</p>
          </div>
          {isAuthenticated && (
            <button onClick={(e) => { e.stopPropagation(); onFavorite(sermonId); }} className={`transition-colors ${isFavorite ? "text-[#FF7E45]" : "text-gray-400 hover:text-[#FF7E45]"}`}>
              <i className={`${isFavorite ? "fas" : "far"} fa-heart`}></i>
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <span className="mr-3"><i className="fas fa-eye mr-1"></i> {sermon.views || 0}</span>
          <span><i className="fas fa-clock mr-1"></i> {sermon.duration || '45:00'}</span>
        </div>
      </div>
    </div>
  );
};

const SermonModal = ({ sermon, isFavorite, onClose, onFavorite, isAuthenticated, formatDate }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const sermonId = sermon._id || sermon.id;

  useEffect(() => {
    if (sermon.videoUrl) {
      initializeVideoPlayer();
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sermon.videoUrl]);

  const initializeVideoPlayer = () => {
    if (!videoRef.current) return;

    try {
      if (playerRef.current) {
        playerRef.current.dispose();
      }

      const isHLS = sermon.videoUrl.includes('.m3u8');

      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        fluid: true,
        responsive: true,
        sources: [{
          src: sermon.videoUrl,
          type: isHLS ? 'application/x-mpegURL' : 'video/mp4'
        }],
        html5: {
          vhs: {
            overrideNative: !videojs.browser.IS_SAFARI,
          }
        }
      });

      playerRef.current = player;
    } catch (error) {
      console.error('Error initializing video player in modal:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="aspect-w-16 aspect-h-9 bg-black">
            <div data-vjs-player className="w-full h-64 md:h-96">
              <video ref={videoRef} className="video-js vjs-default-skin vjs-big-play-centered w-full h-full" playsInline>
                <p className="vjs-no-js">
                  To view this video please enable JavaScript, and consider upgrading to a
                  web browser that <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">supports HTML5 video</a>
                </p>
              </video>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-70 z-10">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold">{sermon.title}</h3>
              <p className="text-gray-600">{sermon.speaker} • {formatDate(sermon.date)}</p>
            </div>
            {isAuthenticated && (
              <button onClick={() => onFavorite(sermonId)} className={`flex items-center ${isFavorite ? "text-[#FF7E45]" : "text-gray-400 hover:text-[#FF7E45]"}`}>
                <i className={`${isFavorite ? "fas" : "far"} fa-heart mr-1`}></i>
                {isFavorite ? 'Remove from' : 'Add to'} Favorites
              </button>
            )}
          </div>

          <p className="text-gray-700 mb-6">{sermon.description}</p>

          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded capitalize">{sermon.category}</span>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded"><i className="fas fa-eye mr-1"></i> {sermon.views || 0} views</span>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded"><i className="fas fa-thumbs-up mr-1"></i> {sermon.likes || 0} likes</span>
          </div>

          <div className="flex flex-wrap gap-4">
            <a className="btn bg-[#333] text-white hover:bg-gray-700 transition-colors" href={sermon.audioUrl || '#'} download>
              <i className="fas fa-download mr-2"></i> Download Audio
            </a>
            <button className="btn bg-[#FF7E45] text-white hover:bg-[#FFA76A] transition-colors">
              <i className="fas fa-share-alt mr-2"></i> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditSermonModal = ({ editForm, setEditForm, onClose, onSubmit, categories, isAdmin }) => {
  const generateLocalKey = () => `smc_${uuidv4()}`;
  const handleGenerateKey = async () => {
    if (sermonService.generateKey) {
      try {
        const res = await sermonService.generateKey();
        const key = res?.data?.streamKey || res?.data || res;
        setEditForm(prev => ({ ...prev, streamKey: key }));
        return;
      } catch (e) {
        console.warn('generateKey API failed, falling back to client key', e.message);
      }
    }
    setEditForm(prev => ({ ...prev, streamKey: generateLocalKey() }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">{editForm._id ? 'Edit Sermon' : 'Add New Sermon'}</h2>

          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Speaker *</label>
                <input type="text" value={editForm.speaker} onChange={(e) => setEditForm({ ...editForm, speaker: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]">
                  {categories.map(category => <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image URL *</label>
                <input type="url" value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]" required />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows="3" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]" required />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Video URL</label>
              <input type="url" value={editForm.videoUrl} onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]" placeholder="https://example.com/stream.m3u8" />
            </div>

            {/* Admin-only live controls */}
            {isAdmin && (
              <>
                <div className="mb-4 flex items-center gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={!!editForm.isLive} onChange={(e) => setEditForm({ ...editForm, isLive: e.target.checked })} />
                    <span className="text-sm">Set as Live (assign stream key & start)</span>
                  </label>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <input type="text" value={editForm.streamKey || ''} onChange={(e) => setEditForm({ ...editForm, streamKey: e.target.value })} placeholder="Stream Key (smc_...)" className="p-3 border border-gray-300 rounded-lg col-span-2" />
                  <div>
                    <button type="button" onClick={handleGenerateKey} className="w-full px-4 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#FFA76A]">Generate Key</button>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#FFA76A] transition-colors">{editForm._id ? 'Update' : 'Create'} Sermon</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SermonsPage;
