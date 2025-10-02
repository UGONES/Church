import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { eventService } from '../services/apiService'; // Fixed import path
import PageLoader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { Event } from '../models/Events'; // Fixed import name

const EventsPage = ({ user }) => {
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
    title: '',
    description: '',
    location: '',
    category: 'service',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    capacity: 50,
    imageUrl: ''
  });

  const isAdmin = user?.role === "admin";
  const isAuthenticated = user?.isLoggedIn;

  // Fetch events and user data
  useEffect(() => {
    document.title = "SMC: - Events | St. Micheal`s & All Angels Church | Ifite-Awka";
    fetchEvents();
    if (isAuthenticated) {
      fetchUserRsvps();
      fetchUserFavorites();
    }
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await eventService.getAll();
      
      if (response.success) {
        const eventsData = response.data.map(event => new Event(event));
        
        const formattedEvents = eventsData.map(event => ({
          id: event._id || event.id,
          title: event.title,
          start: event.startTime || event.start,
          end: event.endTime || event.end,
          extendedProps: {
            description: event.description,
            location: event.location,
            category: event.category,
            imageUrl: event.imageUrl,
            capacity: event.capacity,
            registered: event.registeredCount || event.registered,
            status: event.status
          },
          backgroundColor: getEventColor(event.category),
          borderColor: getEventColor(event.category),
          textColor: '#ffffff'
        }));

        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
      alert.error('Failed to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRsvps = async () => {
    try {
      const response = await eventService.getUserRsvps();
      if (response.success) {
        setUserRsvps(new Set(response.data.map(rsvp => rsvp.eventId || rsvp.event?._id)));
      }
    } catch (error) {
      console.error('Error fetching user RSVPs:', error);
      alert.error('Failed to load your RSVPs.');
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const response = await eventService.getUserFavorites();
      if (response.success) {
        setUserFavorites(new Set(response.data.map(fav => fav.eventId || fav.event?._id)));
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      alert.error('Failed to load your favorites.');
    }
  };

  const getEventColor = (category) => {
    const colors = {
      service: '#FF7E45',
      meeting: '#4299E1',
      social: '#48BB78',
      conference: '#9F7AEA',
      default: '#718096'
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
      status: event.extendedProps?.status
    });
    setShowEventModal(true);
  };

  const handleRSVP = async (eventId) => {
    if (!isAuthenticated) {
      alert.info("Please log in to RSVP");
      return;
    }

    try {
      if (userRsvps.has(eventId)) {
        const response = await eventService.cancelRsvp(eventId);
        if (response.success) {
          setUserRsvps(prev => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });
          alert.success("RSVP cancelled successfully.");
        }
      } else {
        const response = await eventService.rsvp(eventId);
        if (response.success) {
          setUserRsvps(prev => new Set(prev).add(eventId));
          alert.success("Thank you for your RSVP! You're all set for this event.");
        }
      }
    } catch (error) {
      console.error('RSVP error:', error);
      if (error.response?.status === 409) {
        alert.error("This event is already at capacity.");
      } else {
        alert.error("Failed to process RSVP. Please try again.");
      }
    }
  };

  const handleAddToFavorites = async (eventId) => {
    if (!isAuthenticated) {
      alert.info("Please log in to add to favorites");
      return;
    }

    try {
      if (userFavorites.has(eventId)) {
        const response = await eventService.removeFavorite(eventId);
        if (response.success) {
          setUserFavorites(prev => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });
          alert.success("Removed from favorites!");
        }
      } else {
        const response = await eventService.addFavorite(eventId);
        if (response.success) {
          setUserFavorites(prev => new Set(prev).add(eventId));
          alert.success("Added to your favorites!");
        }
      }
    } catch (error) {
      console.error('Favorite error:', error);
      alert.error("Failed to update favorites. Please try again.");
    }
  };

  // Admin functions
  const handleCreateEvent = async (eventData) => {
    try {
      const response = await eventService.create(eventData);
      if (response.success) {
        alert.success('Event created successfully');
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          location: '',
          category: 'service',
          startTime: new Date().toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
          capacity: 50,
          imageUrl: ''
        });
        fetchEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert.error('Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      const response = await eventService.update(eventId, eventData);
      if (response.success) {
        alert.success('Event updated successfully');
        setShowEventModal(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert.error('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await eventService.delete(eventId);
      if (response.success) {
        alert.success('Event deleted successfully');
        setShowEventModal(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert.error('Failed to delete event');
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

  // Function to handle creating a new event (for admin)
  const handleCreateNewEvent = () => {
    setShowCreateModal(true);
  };

  // Handle form input changes for creating events
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return <PageLoader type="spinner" text="Loading events..." fullScreen={true} />;
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
                <i className="fas fa-plus mr-2"></i>Create New Event
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
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
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
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
            />
          </div>
        </div>
      </section>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

              {/* Event Image */}
              {selectedEvent.imageUrl && (
                <div className="mb-4">
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="mb-4 space-y-2">
                <div className="flex items-center text-gray-600">
                  <span className="mr-2 w-6"><i className="fas fa-calendar-alt"></i></span>
                  <span>{formatDate(new Date(selectedEvent.start))}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="mr-2 w-6"><i className="fas fa-clock"></i></span>
                  <span>
                    {formatTime(new Date(selectedEvent.start))} - {formatTime(new Date(selectedEvent.end))}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2 w-6"><i className="fas fa-map-marker-alt"></i></span>
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.capacity && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2 w-6"><i className="fas fa-users"></i></span>
                    <span>
                      {selectedEvent.registered || 0} / {selectedEvent.capacity} registered
                      {selectedEvent.registered >= selectedEvent.capacity && (
                        <span className="ml-2 text-red-500">(Full)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 mb-6">{selectedEvent.description}</p>

              <div className="flex justify-between items-center space-x-4">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => handleRSVP(selectedEvent.id)}
                      className={`flex-1 py-2 px-4 rounded-md transition-colors ${userRsvps.has(selectedEvent.id)
                          ? "bg-gray-500 hover:bg-gray-600 text-white"
                          : selectedEvent.registered >= selectedEvent.capacity
                            ? "bg-gray-400 cursor-not-allowed text-white"
                            : "bg-[#FF7E45] hover:bg-[#E56A36] text-white"
                        }`}
                      disabled={selectedEvent.registered >= selectedEvent.capacity && !userRsvps.has(selectedEvent.id)}
                    >
                      <span className="mr-2">
                        <i className={`fas ${userRsvps.has(selectedEvent.id) ? 'fa-times' : 'fa-check'}`}></i>
                      </span>
                      {userRsvps.has(selectedEvent.id) ? 'Cancel RSVP' : 'RSVP'}
                    </button>

                    <button
                      onClick={() => handleAddToFavorites(selectedEvent.id)}
                      className={`p-2 rounded-md transition-colors ${userFavorites.has(selectedEvent.id)
                          ? "text-[#FF7E45] bg-orange-100"
                          : "text-gray-400 hover:text-[#FF7E45] hover:bg-gray-100"
                        }`}
                    >
                      <i className={`fas ${userFavorites.has(selectedEvent.id) ? 'fa-heart text-red-500' : 'fa-heart'}`}></i>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => alert.info("Please log in to RSVP")}
                    className="flex-1 bg-[#FF7E45] hover:bg-[#E56A36] text-white py-2 px-4 rounded-md transition-colors"
                  >
                    <span className="mr-2"><i className="fas fa-lock"></i></span> Login to RSVP
                  </button>
                )}
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold mb-2">Admin Actions</h4>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleUpdateEvent(selectedEvent.id, selectedEvent)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      <i className="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      <i className="fas fa-trash mr-1"></i>Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                  <label className="block text-sm font-medium mb-1">Event Title</label>
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
                  <label className="block text-sm font-medium mb-1">Description</label>
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
                  <label className="block text-sm font-medium mb-1">Location</label>
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
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={newEvent.startTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
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
                  <label className="block text-sm font-medium mb-1">Capacity</label>
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