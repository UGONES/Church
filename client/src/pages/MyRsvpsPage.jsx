import React, { useState, useEffect } from "react";
import Loader, { ContentLoader } from "../components/Loader";
import { useAlert } from "../utils/Alert";
import useAuth from "../hooks/useAuth";
import { eventService } from "../services/apiService";

const MyRSVPsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const alert = useAlert();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title =
      "SMC: - RSVPs | St. Michael's & All Angels Church | Ifite-Awka";

    if (!user || !user.id) {
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
        eventService.getUserRsvps(),
        eventService.getUserPastRsvps(),
      ]);

      // Process upcoming events
      if (upcomingResponse.status === 'fulfilled') {
        const upcomingData = upcomingResponse.value.data || upcomingResponse.value;
        const upcoming = (Array.isArray(upcomingData) ? upcomingData : [])
          .filter(event => new Date(event.date || event.startTime) > new Date())
          .map(event => ({
            ...event,
            id: event._id || event.id,
            title: event.title || 'Untitled Event',
            date: event.date || event.startTime,
            location: event.location || 'TBA',
            status: event.rsvpStatus || 'Confirmed',
          }));
        setUpcomingEvents(upcoming);
      } else {
        console.error("Error fetching upcoming events:", upcomingResponse.reason);
      }

      // Process past events
      if (pastResponse.status === 'fulfilled') {
        const pastData = pastResponse.value.data || pastResponse.value;
        const past = (Array.isArray(pastData) ? pastData : [])
          .filter(event => new Date(event.date || event.startTime) <= new Date())
          .map(event => ({
            ...event,
            id: event._id || event.id,
            title: event.title || 'Untitled Event',
            date: event.date || event.startTime,
            location: event.location || 'TBA',
            attendanceStatus: event.attendanceStatus || 'Attended',
            recordingAvailable: event.recordingUrl || false,
            materialsAvailable: event.materialsUrl || false,
          }));
        setPastEvents(past);
      } else {
        console.error("Error fetching past events:", pastResponse.reason);
        // Fallback: filter upcoming events for past ones
        if (upcomingResponse.status === 'fulfilled') {
          const upcomingData = upcomingResponse.value.data || upcomingResponse.value;
          const past = (Array.isArray(upcomingData) ? upcomingData : [])
            .filter(event => new Date(event.date || event.startTime) <= new Date())
            .map(event => ({
              ...event,
              id: event._id || event.id,
              title: event.title || 'Untitled Event',
              date: event.date || event.startTime,
              location: event.location || 'TBA',
              attendanceStatus: event.attendanceStatus || 'Attended',
            }));
          setPastEvents(past);
        }
      }

    } catch (err) {
      console.error("Error fetching RSVPs:", err);
      const errorMsg = err.response?.data?.message || "Failed to load your events";
      setError(errorMsg);
      alert.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Fixed RSVP cancellation
  const handleCancelRSVP = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to cancel your RSVP for "${eventTitle}"?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await eventService.cancelRsvp(eventId);
      
      if (response.data?.success || response.success) {
        await fetchRSVPs(); // Refresh the list
        alert.success("RSVP cancelled successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to cancel RSVP");
      }
    } catch (err) {
      console.error("Error canceling RSVP:", err);
      const errorMsg = err.response?.data?.message || "Failed to cancel RSVP";
      setError(errorMsg);
      alert.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Fixed calendar integration
  const handleAddToCalendar = async (eventId, eventTitle) => {
    try {
      setActionLoading(true);
      
      // This would typically integrate with a calendar service
      // For now, we'll create a simple .ics file download
      const event = [...upcomingEvents, ...pastEvents].find(e => e.id === eventId);
      if (event) {
        const icsContent = generateICSEvent(event);
        downloadICSFile(icsContent, eventTitle);
        alert.success(`"${eventTitle}" added to your calendar!`);
      }
    } catch (err) {
      console.error("Error adding to calendar:", err);
      alert.error("Failed to add event to calendar");
    } finally {
      setActionLoading(false);
    }
  };

   // Helper function to generate ICS content
  const generateICSEvent = (event) => {
    const startDate = new Date(event.date || event.startTime).toISOString().replace(/-|:|\.\d+/g, '');
    const endDate = new Date(new Date(event.date || event.startTime).getTime() + 2 * 60 * 60 * 1000) // 2 hours later
      .toISOString().replace(/-|:|\.\d+/g, '');
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || 'Church event'}`,
      `LOCATION:${event.location || 'Church location'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
  };

    // Helper function to download ICS file
  const downloadICSFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Fixed recording access
  const handleViewRecording = async (eventId) => {
    try {
      const event = pastEvents.find(e => e.id === eventId);
      if (event?.recordingUrl) {
        window.open(event.recordingUrl, '_blank');
      } else {
        alert.info("Recording not available for this event");
      }
    } catch (err) {
      console.error("Error accessing recording:", err);
      alert.error("Failed to access recording");
    }
  };

  // Fixed materials download
  const handleDownloadMaterials = async (eventId) => {
    try {
      const event = pastEvents.find(e => e.id === eventId);
      if (event?.materialsUrl) {
        window.open(event.materialsUrl, '_blank');
      } else {
        alert.info("Materials not available for this event");
      }
    } catch (err) {
      console.error("Error downloading materials:", err);
      alert.error("Failed to download materials");
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        day: date.getDate().toString().padStart(2, "0"),
        month: date.toLocaleString("default", { month: "short" }).toUpperCase(),
        time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fullDate: date.toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric" 
        })
      };
    } catch {
      return { day: "--", month: "---", time: "--:--", fullDate: "Unknown date" };
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <ContentLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user || !user.id) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to view your RSVPs.
              </p>
              <a href="/login" className="btn btn-primary">
                Log In
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
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
                {loading ? "Loading..." : "Try Again"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main page
  return (
    <div className="page">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My RSVPs & Events</h1>

          {/* Upcoming */}
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
                            <div className="text-2xl font-bold">
                              {formattedDate.day}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formattedDate.month}
                            </div>
                            <div className="text-sm mt-2">
                              {formattedDate.time}
                            </div>
                          </div>
                        </div>
                        <div className="md:w-3/4 p-4 md:p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">{event.title}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                event.status === "confirmed" || event.status === "Comfirmed"
                                  ? "bg-green-100 text-green-800"
                                  : event.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
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

          {/* Past */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Past Events</h2>
            {pastEvents.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-history text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500">
                  You haven't attended any events yet.
                </p>
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
                            <div className="text-2xl font-bold text-gray-500">
                              {formattedDate.day}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formattedDate.month}
                            </div>
                            <div className="text-sm mt-2 text-gray-500">
                              {formattedDate.time}
                            </div>
                          </div>
                        </div>
                        <div className="md:w-3/4 p-4 md:p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-700">
                              {event.title}
                            </h3>
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                              {event.attendanceStatus || "Attended"}
                            </span>
                          </div>
                          <p className="text-gray-500 mb-4">
                            {event.description}
                          </p>
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                            <div className="text-sm text-gray-500">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                               {event.location || 'Unknown location'}
                            </div>
                            <div className="flex space-x-3">
                              {event.recordingAvailable && (
                                <button
                                  onClick={() =>
                                    handleViewRecording(event.id || event._id)
                                  }
                                  className="text-[#FF7E45] hover:text-[#F4B942] text-sm inline-flex items-center"
                                >
                                  <i className="fas fa-play-circle mr-1"></i>{" "}
                                  Watch Recording
                                </button>
                              )}
                              {event.materialsAvailable && (
                                <button
                                  onClick={() =>
                                    handleDownloadMaterials(event.id || event._id)
                                  }
                                  className="text-[#FF7E45] hover:text-[#F4B942] text-sm inline-flex items-center"
                                >
                                  <i className="fas fa-download mr-1"></i>{" "}
                                  Materials
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
          </div>
        </div>
      </div>

      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <Loader
           type="spinner" 
           size="medium" 
           color="#FF7E45" 
           text="Processing..." 
          />
        </div>
      )}
    </div>
  );
};

export default MyRSVPsPage;
