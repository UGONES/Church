import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { eventService } from '../services/apiService';
import PageLoader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { Event } from '../models/Events';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const EventsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const alert = useAlert();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRsvps, setUserRsvps] = useState(new Set());
  const [userFavorites, setUserFavorites] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    category: "service",
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    capacity: 50,
    imageUrl: "",
  });

  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  // Fetch events and user data
  useEffect(() => {
    document.title =
      "SMC: - Events | St. Micheal`s & All Angels Church | Ifite-Awka";
    fetchEvents();
  }, []);

  useEffect(() => {
    // When auth state changes, refresh user-specific data
    if (isAuthenticated) {
      fetchUserRsvps();
      fetchUserFavorites();
    } else {
      setUserRsvps(new Set());
      setUserFavorites(new Set());
    }
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await eventService.getAll();
      console.log("🎯 Events response:", response);

      const rawEvents = Array.isArray(response.data)
        ? response.data
        : response.data?.events || [];
      const eventsData = rawEvents.map((event) => new Event(event));

      const formattedEvents = eventsData.map((event) => ({
        id: event._id || event.id,
        title: event.title,
        start: event.startTime || event.start,
        end: event.endTime || event.end,
        extendedProps: {
          ...event,
          canRSVP: isAuthenticated,
          isPastEvent: new Date(event.endTime || event.end) < new Date(), // Check if event has passed
        },
        backgroundColor: getEventColor(event.category),
        borderColor: getEventColor(event.category),
        textColor: "#2a1a1aff",
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again later.");
      alert.error("Failed to load events. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRsvps = async () => {
    try {
      const response = await eventService.getUserRsvps();
      if (response.success) {
        const rsvps = response?.data?.rsvps || [];
        setUserRsvps(new Set((Array.isArray(rsvps) ? rsvps : []).map(r => r.eventId || r.event?._id)));
      }
    } catch (error) {
      console.error("Error fetching user RSVPs:", error);
      alert.error("Failed to load your RSVPs.");
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const response = await eventService.getUserFavorites();
      if (response.data?.success) {
        const favs = response?.data?.favorites?.events || [];
        setUserFavorites(new Set((Array.isArray(favs) ? favs : []).map(f => f._id || f.eventId || f._id)));
      }
      return;
    } catch (error) {
      console.error('Favorite error:', error);
      if (error.response?.status === 409) {
        alert.error(error.response?.data?.message || "there is an error in loading your favorites.");
      } else {
        alert.error("Failed to load favorites. Please try again.");
      }
    }
  };

  const getEventColor = (category) => {
    const colors = {
      service: "#fffc45ff",
      meeting: "#4299E1",
      social: "#48BB78",
      conference: "#9F7AEA",
      default: "#718096",
    };
    return colors[category] || colors.default;
  };

  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      description: event.extendedProps?.description,
      location: event.extendedProps?.location,
      category: event.extendedProps?.category,
      imageUrl: event.extendedProps?.imageUrl,
      capacity: event.extendedProps?.capacity,
      registered: event.extendedProps?.registered,
      status: event.extendedProps?.status,
      isPastEvent: event.extendedProps?.isPastEvent
    });
    setShowEventModal(true);
  };

  const handleRSVP = async (eventId) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      alert.info("Please log in to RSVP for events");
      navigate('/login');
      return;
    }

    try {
      if (userRsvps.has(eventId)) {
        // Cancel RSVP
        const response = await eventService.cancelRsvp(eventId);
        if (response.data?.message || response.message) {
          await fetchEvents();
          await fetchUserRsvps();
          alert.success("RSVP cancelled successfully.");
        }
      } else {
        const response = await eventService.rsvp(eventId);
        if (response.data?.message || response.message) {
          await fetchEvents();
          await fetchUserRsvps();
          alert.success("Thank you for your RSVP! You're all set for this event.");
        }
      }
    } catch (error) {
      console.error("RSVP error:", error);
      if (error.response?.status === 409) {
        alert.error(error.response?.data?.message || "This event is already at capacity.");
      } else {
        alert.error("Failed to process RSVP. Please try again.");
      }
    }
  };

  const handleAddToFavorites = async (eventId) => {
    if (!isAuthenticated) {
      alert.info("Please log in to add events to favorites");
      navigate('/login');
      return;
    }

    const already = userFavorites.has(eventId)

    setUserFavorites(prev => {
      const copy = new Set(prev);
      if (already) copy.delete(eventId);
      else copy.add(eventId);
      return copy;
    });

    try {
      const response = already ? await eventService.removeFavorite(eventId) : await eventService.addFavorite(eventId);
      if (!response.data?.success && !response.success) {
        throw new Error(response.data?.message || 'Failed to update favorites');
      }
      alert.success(already ? 'Removed from favorites!' : 'Added to your favorites!');

      await fetchUserFavorites();
    } catch (error) {
      setUserFavorites(prev => {
        const copy = new Set(prev);
        if (already) copy.add(eventId);
        else copy.delete(eventId);
        return copy;
      });
      console.error('Favorite error:', error);
      if (error.response?.status === 409) {
        alert.error("This event is already at capacity.");
      } else {
        alert.error(err.response?.data?.message || err.message || "Failed to process favorites. Please try again.");
      }
    }
  };

  // Admin functions
  const handleCreateEvent = async (eventData) => {
    try {
      const response = await eventService.create(eventData);
      if (response.success) {
        alert.success("Event created successfully");
        setShowCreateModal(false);
        setNewEvent({
          title: "",
          description: "",
          location: "",
          category: "service",
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
          capacity: 50,
          imageUrl: "",
        });
        fetchEvents();

      }
    } catch (error) {
      console.error('Error creating event:', error);
      const message = error?.response?.data?.message || 'Failed to create event';
      alert.error(message);
      return { success: false, message };
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      const response = await eventService.update(eventId, eventData);
      if (response.success) {
        alert.success("Event updated successfully");
        setShowEventModal(false);
        fetchEvents();
      }
    } catch (err) {
      console.error('Error updating event:', err);
      const message = err?.response?.data?.message || 'Failed to update event';
      alert.error(message);
      return { success: false, message };
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await eventService.delete(eventId);
      if (response.success) {
        alert.success("Event deleted successfully");
        setShowEventModal(false);
        fetchEvents();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      const message = err?.response?.data?.message || 'Failed to delete event';
      alert.error(message);
      return { success: false, message };
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isEventInPast = (endTime) => {
    return new Date(endTime) < new Date();
  };

  // Function to handle creating a new event (for admin)
  const handleCreateNewEvent = () => {
    setShowCreateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return <PageLoader type="spinner" text="Loading events..." fullScreen />;
  }

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Events Calendar</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Stay connected with all the happenings at St Michael's
          </p>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={handleCreateNewEvent}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-plus mr-2" />
                Create New Event
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Calendar Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-8">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,listMonth",
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              eventDisplay="block"
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
            />
          </div>
        </div>
      </section>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">{selectedEvent.title}</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              {/* Event status badge */}
              {isEventInPast(selectedEvent.end) && (
                <div className="mb-4">
                  <span className="inline-block bg-gray-500 text-white text-sm px-3 py-1 rounded-full">
                    <i className="fas fa-history mr-1"></i> Past Event
                  </span>
                </div>
              )}

              {/* Event Image */}
              {selectedEvent.imageUrl && (
                <div className="mb-4">
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="mb-4 space-y-2">
                <div className="flex items-center text-gray-600">
                  <span className="mr-2 w-6">
                    <i className="fas fa-calendar-alt" />
                  </span>
                  <span>{formatDate(new Date(selectedEvent.start))}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="mr-2 w-6">
                    <i className="fas fa-clock" />
                  </span>
                  <span>
                    {formatTime(new Date(selectedEvent.start))} -{" "}
                    {formatTime(new Date(selectedEvent.end))}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2 w-6">
                      <i className="fas fa-map-marker-alt" />
                    </span>
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.capacity && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2 w-6">
                      <i className="fas fa-users" />
                    </span>
                    <span>
                      {selectedEvent.registered || 0} / {selectedEvent.capacity}{" "}
                      registered
                      {selectedEvent.registered >= selectedEvent.capacity && (
                        <span className="ml-2 text-red-500">(Full)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 mb-6">{selectedEvent.description}</p>

              <div className="flex justify-between items-center space-x-4">
                {/* RSVP and Favorite buttons - FIXED LOGIC */}
                {isAuthenticated && (
                  <>
                    {/* RSVP Button */}
                    <button
                      onClick={() => handleRSVP(selectedEvent.id)}
                      className={`flex-1 py-2 px-4 rounded-md transition-colors ${selectedEvent.isPastEvent
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : userRsvps.has(selectedEvent.id)
                          ? "bg-gray-500 hover:bg-gray-600 text-white"
                          : selectedEvent.registered >= selectedEvent.capacity
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : "bg-[#FF7E45] hover:bg-[#E56A36] text-white"
                        }`}
                      disabled={
                        selectedEvent.isPastEvent ||
                        (selectedEvent.registered >= selectedEvent.capacity && !userRsvps.has(selectedEvent.id))
                      }
                    >
                      <span className="mr-2">
                        <i className={`fas ${selectedEvent.isPastEvent
                          ? 'fa-clock'
                          : userRsvps.has(selectedEvent.id)
                            ? 'fa-times'
                            : 'fa-check'
                          }`}></i>
                      </span>
                      {selectedEvent.isPastEvent
                        ? 'Event Ended'
                        : userRsvps.has(selectedEvent.id)
                          ? 'Cancel RSVP'
                          : 'RSVP Now'
                      }
                    </button>

                    {/* Favorite Button */}
                    <button
                      onClick={() => handleAddToFavorites(selectedEvent.id)}
                      className={`p-2 rounded-md transition-colors ${userFavorites.has(selectedEvent.id)
                        ? "text-[#FF7E45] bg-orange-100"
                        : "text-gray-400 hover:text-[#FF7E45] hover:bg-gray-100"
                        }`}
                    >
                      <i className={`fas ${userFavorites.has(selectedEvent.id)
                        ? 'fa-heart text-red-500'
                        : 'fa-heart'
                        }`}></i>
                    </button>
                  </>
                )}

                {/* Show login prompt for unauthenticated users */}
                {!isAuthenticated && !isAdmin && (
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      navigate('/login');
                    }}
                    className="flex-1 bg-[#FF7E45] hover:bg-[#E56A36] text-white py-2 px-4 rounded-md transition-colors"
                  >
                    <span className="mr-2"><i className="fas fa-sign-in-alt"></i></span>
                    Login to RSVP
                  </button>
                )}
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-2">Admin Actions</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleUpdateEvent(selectedEvent.id, selectedEvent)
                      }
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      <i className="fas fa-edit mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <i className="fas fa-trash mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal (same as before) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Create New Event</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Enter event description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={newEvent.location}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter event location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={newEvent.startTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={newEvent.endTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={newEvent.capacity}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter capacity"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateEvent(newEvent)}
                  className="px-4 py-2 bg-[#FF7E45] text-white rounded-md hover:bg-[#E56A36]"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
