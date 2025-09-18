import React, { useState, useEffect } from "react";
import { apiClient } from "../utils/api";
import Loader, { ContentLoader } from "../components/Loader";
import { useAlert } from '../utils/Alert';

const MyRSVPsPage = ({ user }) => {
  const alert = useAlert();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_ENDPOINTS = {
    UPCOMING_RSVPS: "/rsvps/upcoming",
    PAST_RSVPS: "/rsvps/past",
    CANCEL_RSVP: "/rsvps/cancel/",
    ADD_TO_CALENDAR: "/calendar/add/",
    EVENT_RECORDINGS: "/events/recordings/",
    EVENT_MATERIALS: "/events/materials/",
  };

  useEffect(() => {
    document.title = "SMC: - RSVPs | St. Micheal`s & All Angels Church | Ifite-Awka";
    
    // Check if user is authenticated
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchRSVPs();
  }, [user]);

  const fetchRSVPs = async () => {
    try {
      setLoading(true);
      setError(null);
      const [upcomingResponse, pastResponse] = await Promise.allSettled([
        apiClient.get(API_ENDPOINTS.UPCOMING_RSVPS),
        apiClient.get(API_ENDPOINTS.PAST_RSVPS)
      ]);
      if (upcomingResponse.status === 'fulfilled') {
        setUpcomingEvents(upcomingResponse.value || []);
      } else {
        console.error("Error fetching upcoming events:", upcomingResponse.reason);
        alert.error("Failed to load upcoming events.");
      }
      if (pastResponse.status === 'fulfilled') {
        setPastEvents(pastResponse.value || []);
      } else {
        console.error("Error fetching past events:", pastResponse.reason);
        alert.error("Failed to load past events.");
      }
      if (upcomingResponse.status === 'rejected' && pastResponse.status === 'rejected') {
        throw new Error("Failed to load events. Please check your connection.");
      }
    } catch (err) {
      console.error("Error fetching RSVPs:", err);
      setError(err.message || "Failed to load your events. Please try again.");
      alert.error(err.message || "Failed to load your events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRSVP = async (eventId, eventTitle) => {
    alert.info(`Are you sure you want to cancel your RSVP for "${eventTitle}"?`, {
      confirm: async () => {
        try {
          setActionLoading(true);
          const response = await apiClient.post(`${API_ENDPOINTS.CANCEL_RSVP}${eventId}`);
          if (response.success) {
            fetchRSVPs();
            alert.success('RSVP cancelled successfully!');
          } else {
            throw new Error(response.message || "Failed to cancel RSVP");
          }
        } catch (err) {
          console.error("Error canceling RSVP:", err);
          setError(err.message || "Failed to cancel RSVP. Please try again.");
          alert.error(err.message || "Failed to cancel RSVP. Please try again.");
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleAddToCalendar = async (eventId, eventTitle) => {
    try {
      setActionLoading(true);
      const response = await apiClient.post(`${API_ENDPOINTS.ADD_TO_CALENDAR}${eventId}`);
      if (response.success) {
        alert.success(`"${eventTitle}" has been added to your calendar successfully!`);
      } else {
        throw new Error(response.message || "Failed to add to calendar");
      }
    } catch (err) {
      console.error("Error adding to calendar:", err);
      setError(err.message || "Failed to add event to calendar. Please try again.");
      alert.error(err.message || "Failed to add event to calendar. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewRecording = async (eventId) => {
    try {
      window.open(`${API_ENDPOINTS.EVENT_RECORDINGS}${eventId}`, '_blank');
    } catch (err) {
      console.error("Error accessing recording:", err);
      setError("Failed to access recording. Please try again.");
      alert.error("Failed to access recording. Please try again.");
    }
  };

  const handleDownloadMaterials = async (eventId) => {
    try {
      window.open(`${API_ENDPOINTS.EVENT_MATERIALS}${eventId}`, '_blank');
    } catch (err) {
      console.error("Error downloading materials:", err);
      setError("Failed to download materials. Please try again.");
      alert.error("Failed to download materials. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      console.error("Error formatting date:", error);
      return {
        day: '--',
        month: '---',
        time: '--:--'
      };
    }
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
              <p className="text-gray-600 mb-6">You need to be logged in to view your RSVPs.</p>
              <a href="/login" className="btn btn-primary">Log In</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My RSVPs & Events</h1>
            <div className="space-y-8">
              <ContentLoader type="card" count={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-3">
                <i className="fas fa-exclamation-triangle text-red-500 text-xl mr-2"></i>
                <h2 className="text-xl font-semibold text-red-800">Error Loading Events</h2>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchRSVPs}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My RSVPs & Events</h1>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-calendar-plus text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500 mb-2">You have no upcoming events.</p>
                <a 
                  href="/events" 
                  className="text-[#FF7E45] hover:text-[#F4B942] font-medium inline-flex items-center"
                >
                  <i className="fas fa-arrow-right mr-2"></i>Browse upcoming events
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const formattedDate = formatDate(event.date || event.startTime);
                  return (
                    <div key={event.id || event._id} className="border rounded-lg overflow-hidden transition-shadow hover:shadow-lg">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 bg-gray-100 flex items-center justify-center p-4 md:p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{formattedDate.day}</div>
                            <div className="text-sm text-gray-600">{formattedDate.month}</div>
                            <div className="text-sm mt-2">{formattedDate.time}</div>
                          </div>
                        </div>
                        <div className="md:w-3/4 p-4 md:p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{event.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              event.status === 'Confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : event.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status || "Confirmed"}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-4">{event.description}</p>
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                            <div className="text-sm text-gray-500">
                              <i className="fas fa-map-marker-alt mr-1"></i> {event.location || 'TBA'}
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleAddToCalendar(event.id || event._id, event.title)}
                                className="text-[#FF7E45] hover:text-[#F4B942] text-sm inline-flex items-center"
                                disabled={actionLoading}
                              >
                                <i className="far fa-calendar-alt mr-1"></i> Add to Calendar
                              </button>
                              <button 
                                onClick={() => handleCancelRSVP(event.id || event._id, event.title)}
                                className="text-red-500 hover:text-red-700 text-sm inline-flex items-center"
                                disabled={actionLoading}
                              >
                                <i className="fas fa-times mr-1"></i> Cancel RSVP
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Events */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Past Events</h2>

            {pastEvents.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-history text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500">You haven't attended any events yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastEvents.map((event) => {
                  const formattedDate = formatDate(event.date || event.startTime);
                  return (
                    <div key={event.id || event._id} className="border rounded-lg overflow-hidden bg-gray-50 transition-shadow hover:shadow-md">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 bg-gray-100 flex items-center justify-center p-4 md:p-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-500">{formattedDate.day}</div>
                            <div className="text-sm text-gray-500">{formattedDate.month}</div>
                            <div className="text-sm mt-2 text-gray-500">{formattedDate.time}</div>
                          </div>
                        </div>
                        <div className="md:w-3/4 p-4 md:p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-700">{event.title}</h3>
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                              {event.attendanceStatus || "Attended"}
                            </span>
                          </div>
                          <p className="text-gray-500 mb-4">{event.description}</p>
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                            <div className="text-sm text-gray-500">
                              <i className="fas fa-map-marker-alt mr-1"></i> {event.location || 'Unknown location'}
                            </div>
                            <div className="flex space-x-3">
                              {event.recordingAvailable && (
                                <button
                                  onClick={() => handleViewRecording(event.id || event._id)}
                                  className="text-[#FF7E45] hover:text-[#F4B942] text-sm inline-flex items-center"
                                >
                                  <i className="fas fa-play-circle mr-1"></i> Watch Recording
                                </button>
                              )}
                              {event.materialsAvailable && (
                                <button
                                  onClick={() => handleDownloadMaterials(event.id || event._id)}
                                  className="text-[#FF7E45] hover:text-[#F4B942] text-sm inline-flex items-center"
                                >
                                  <i className="fas fa-download mr-1"></i> Materials
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View More Button - Only show if there are more past events */}
            {pastEvents.length > 5 && (
              <div className="mt-6 text-center">
                <button 
                  className="btn btn-outline"
                  onClick={() => {/* Implement pagination or view more logic */}}
                >
                  View More Past Events
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Global loader for actions */}
      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <Loader type="spinner" size="medium" color="#FF7E45" text="Processing..." />
        </div>
      )}
    </div>
  );
};

export default MyRSVPsPage;