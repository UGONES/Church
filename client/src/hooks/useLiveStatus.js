import { useState, useEffect, useCallback } from 'react';
import { sermonService } from '../services/apiService';

export const useLiveStatus = () => {
  const [liveStatus, setLiveStatus] = useState({
    isLive: false,
    offlineMessage: 'No live stream currently active. Check back later for our next service.'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLiveStatus = useCallback(async (isRetry = false) => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 Fetching live status...');

      const response = await sermonService.getLiveStatus();
      console.log('📥 Live Status API Response:', response);

      let liveData = null;

      // ✅ Handle the response structure from sermonController
      if (response?.success) {
        if (response.isLive === true && response.data) {
          // Live stream is active
          liveData = {
            isLive: true,
            liveStreamUrl: response.data.liveStreamUrl,
            currentTitle: response.data.title,
            currentSpeaker: response.data.speaker,
            viewers: response.data.viewers || 0,
            startedAt: response.data.startedAt,
            streamKey: response.data.streamKey,
            sermonId: response.data.sermonId,
            description: response.data.description,
            duration: response.data.duration
          };
          console.log('✅ Live stream detected via API:', liveData.currentTitle);
        } else {
          // No live stream
          liveData = {
            isLive: false,
            offlineMessage: response.data?.offlineMessage || 'No live stream currently active.'
          };
          console.log('❌ No live stream via API');
        }
      } else {
        // API call failed or no success
        liveData = {
          isLive: false,
          offlineMessage: 'Unable to check live stream status.'
        };
      }

      console.log('✅ Final Live Data:', liveData);
      setLiveStatus(liveData);
      setLastUpdate(new Date());
      return liveData;

    } catch (error) {
      console.error('❌ Error fetching live status:', error);
      const fallbackStatus = {
        isLive: false,
        offlineMessage: 'Service unavailable. Please try again later.'
      };
      setLiveStatus(fallbackStatus);
      setLastUpdate(new Date());
      return fallbackStatus;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Auto-refresh when live
  useEffect(() => {
    let pollInterval;

    const startPolling = () => {
      fetchLiveStatus(); // Initial fetch
      
      pollInterval = setInterval(() => {
        console.log('🔄 Polling live status...');
        fetchLiveStatus();
      }, liveStatus.isLive ? 5000 : 15000); // 5s when live, 15s when offline
    };

    startPolling();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchLiveStatus, liveStatus.isLive]);

  return {
    liveStatus,
    isLoading,
    lastUpdate,
    refreshLiveStatus: fetchLiveStatus
  };
};