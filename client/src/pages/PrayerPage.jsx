import { useState, useEffect } from "react";
import {
  prayerService,
  eventService,
  volunteerService,
} from "../services/apiService"; // ✅ Added services
import Loader from "../components/Loader";
import { useAlert } from "../utils/Alert";
import { PrayerRequest } from "../models/PrayerRequest";
import { useAuth } from "../hooks/useAuth";

const PrayerPage = () => {
  const { user } = useAuth;
  const alert = useAlert();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [prayers, setPrayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [prayerTeam, setPrayerTeam] = useState([]);
  const [prayerMeetings, setPrayerMeetings] = useState([]);
  const [prayerStats, setPrayerStats] = useState(null);
  const [activeTab, setActiveTab] = useState("requests"); // ✅ Added active tab state
  const [meetingFilter, setMeetingFilter] = useState("upcoming"); // ✅ Added meeting filter

  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";
  const isAuthenticated = user?.isLoggedIn;

  useEffect(() => {
    document.title =
      "SMC: - Prayers | St. Michael's & All Angels Church | Ifite-Awka";
    fetchPrayers();
    fetchPrayerTeam();
    fetchPrayerMeetings();
    if (isAdmin || isModerator) {
      fetchPrayerStats();
    }
  }, []);

  const fetchPrayers = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await prayerService.getAll(pageNum, 10);
      if (response.success) {
        const prayersData = Array.isArray(response.data)
          ? response.data
          : response.data?.prayers || [];
        const formattedPrayers = prayersData.map(
          (prayer) => new PrayerRequest(prayer),
        );
        setPrayers((prev) =>
          pageNum === 1 ? formattedPrayers : [...prev, ...formattedPrayers],
        );
        setHasMore(response.data?.hasMore || prayersData.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching prayers:", error);
      setError("Failed to load prayer requests. Please try again later.");
      alert.error("Failed to load prayer requests. Please try again later.");
      setPrayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrayerTeam = async () => {
    try {
      const response = await prayerService.getTeam();
      if (response.success) {
        setPrayerTeam(response.data);
      } else {
        // Fallback: Fetch volunteers with prayer ministry role
        const volunteersResponse = await volunteerService.getAll();
        if (volunteersResponse.success) {
          const prayerTeamVolunteers = volunteersResponse.data.filter(
            (volunteer) =>
              volunteer.ministryId?.name?.toLowerCase().includes("prayer") ||
              volunteer.status === "approved",
          );
          setPrayerTeam(prayerTeamVolunteers);
        }
      }
    } catch (error) {
      console.error("Error fetching prayer team:", error);
      // Fallback to empty array
      setPrayerTeam([]);
    }
  };

  const fetchPrayerMeetings = async () => {
    try {
      // ✅ FIXED: Fetch prayer meetings from events with prayer category
      const response = await eventService.getAll({ category: "prayer" });
      if (response.success) {
        const prayerEvents = response.data.filter(
          (event) =>
            event.category?.toLowerCase().includes("prayer") ||
            event.title?.toLowerCase().includes("prayer") ||
            event.description?.toLowerCase().includes("prayer"),
        );
        setPrayerMeetings(prayerEvents);
      }
    } catch (error) {
      console.error("Error fetching prayer meetings:", error);
      setPrayerMeetings([]);
    }
  };

  const fetchPrayerStats = async () => {
    try {
      const response = await prayerService.getStats();
      if (response.success) {
        setPrayerStats(response.data);
      } else {
        // Fallback stats calculation
        const stats = {
          totalRequests: prayers.length,
          prayersThisWeek: prayers.filter(
            (p) =>
              new Date(p.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
          teamMembers: prayerTeam.length,
          upcomingMeetings: prayerMeetings.filter(
            (m) => new Date(m.startTime || m.date) > new Date(),
          ).length,
        };
        setPrayerStats(stats);
      }
    } catch (error) {
      console.error("Error fetching prayer stats:", error);
    }
  };

  const handleSubmitPrayer = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.target);
    const prayerData = {
      request: formData.get("request"),
      isPrivate: formData.get("isPrivate") === "on",
      name: formData.get("name") || "Anonymous",
      email: formData.get("email"),
      notifyOnPray: formData.get("notifyOnPray") === "on",
    };

    try {
      const response = await prayerService.submit(prayerData);

      if (response.success) {
        setSubmitted(true);
        fetchPrayers(1);
        setTimeout(() => {
          setShowForm(false);
          setSubmitted(false);
        }, 3000);
        alert.success("Prayer request submitted successfully!");
      } else {
        setError(response.message || "Failed to submit prayer request");
        alert.error(response.message || "Failed to submit prayer request");
      }
    } catch (error) {
      console.error("Error submitting prayer:", error);
      setError("Failed to submit prayer request. Please try again.");
      alert.error("Failed to submit prayer request. Please try again.");
    }
  };

  const handlePrayForRequest = async (prayerId) => {
    if (!isAuthenticated) {
      alert.info("Please log in to pray for requests");
      return;
    }

    try {
      const response = await prayerService.prayForRequest(prayerId);

      if (response.success) {
        setPrayers((prev) =>
          prev.map((prayer) =>
            prayer._id === prayerId
              ? {
                  ...prayer,
                  prayerCount: (prayer.prayerCount || 0) + 1,
                  userPrayed: true,
                }
              : prayer,
          ),
        );
        alert.success("Thank you for praying!");
      } else {
        alert.error(response.message || "Failed to record your prayer");
      }
    } catch (error) {
      console.error("Error praying for request:", error);
      alert.error("Failed to record your prayer. Please try again.");
    }
  };

  // Filter prayer meetings based on selection
  const getFilteredMeetings = () => {
    const now = new Date();
    switch (meetingFilter) {
      case "upcoming":
        return prayerMeetings.filter(
          (meeting) => new Date(meeting.startTime || meeting.date) > now,
        );
      case "past":
        return prayerMeetings.filter(
          (meeting) => new Date(meeting.startTime || meeting.date) <= now,
        );
      case "weekly":
        return prayerMeetings.filter(
          (meeting) =>
            meeting.title?.toLowerCase().includes("weekly") ||
            meeting.description?.toLowerCase().includes("weekly"),
        );
      default:
        return prayerMeetings;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Prayer Team Tab Component
  const PrayerTeamTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Our Prayer Team</h2>
        <p className="text-gray-600">
          Meet the dedicated volunteers who pray for our church community
        </p>
      </div>

      {/* Prayer Team Stats */}
      {(isAdmin || isModerator) && prayerStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-[#FF7E45]">
              {prayerStats.teamMembers || prayerTeam.length}
            </div>
            <div className="text-sm text-gray-600">Team Members</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-[#FF7E45]">
              {prayerStats.totalRequests || prayers.length}
            </div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-[#FF7E45]">
              {prayerStats.prayersThisWeek || 0}
            </div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-[#FF7E45]">
              {prayerStats.upcomingMeetings || getFilteredMeetings().length}
            </div>
            <div className="text-sm text-gray-600">Upcoming Meetings</div>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prayerTeam.length > 0 ? (
          prayerTeam.map((member, index) => (
            <div
              key={member._id || index}
              className="bg-white rounded-lg shadow-md p-6 text-center"
            >
              <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-600">
                    {member.name?.charAt(0) || "P"}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold mb-1">
                {member.name || "Prayer Team Member"}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {member.role || "Prayer Volunteer"}
              </p>
              <p className="text-gray-700 text-sm mb-4">
                {member.bio || "Committed to praying for our church community"}
              </p>
              <div className="flex justify-center space-x-2">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="text-[#FF7E45] hover:text-[#F4B942]"
                  >
                    <i className="fas fa-envelope" />
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="text-[#FF7E45] hover:text-[#F4B942]"
                  >
                    <i className="fas fa-phone" />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <i className="fas fa-users text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">Prayer team information coming soon</p>
            <button className="btn btn-primary mt-4" onClick={fetchPrayerTeam}>
              Join Prayer Team
            </button>
          </div>
        )}
      </div>

      {/* Join Prayer Team CTA */}
      <div className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] rounded-lg p-8 text-center text-white mt-8">
        <h3 className="text-2xl font-bold mb-2">Join Our Prayer Team</h3>
        <p className="mb-4">Become part of our dedicated prayer ministry</p>
        <button className="bg-white text-[#FF7E45] px-6 py-2 rounded-full font-semibold hover:bg-gray-100">
          Volunteer Now
        </button>
      </div>
    </div>
  );

  // ✅ Prayer Resources Tab Component
  const PrayerResourcesTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Prayer Resources</h2>
        <p className="text-gray-600">
          Tools and guides to help deepen your prayer life
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Prayer Guides */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="w-12 h-12 bg-[#FFF5F0] rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-book-open text-[#FF7E45]" />
          </div>
          <h3 className="text-xl font-bold mb-2">Prayer Guides</h3>
          <p className="text-gray-600 mb-4">
            Step-by-step guides for different types of prayer
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                The Lord's Prayer
              </a>
            </li>
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Prayer for Healing
              </a>
            </li>
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Intercessory Prayer
              </a>
            </li>
          </ul>
        </div>

        {/* Devotionals */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="w-12 h-12 bg-[#FFF5F0] rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-book-bible text-[#FF7E45]" />
          </div>
          <h3 className="text-xl font-bold mb-2">Daily Devotionals</h3>
          <p className="text-gray-600 mb-4">
            Scripture-based prayer devotionals
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Morning Prayer
              </a>
            </li>
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Evening Reflection
              </a>
            </li>
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Weekly Focus
              </a>
            </li>
          </ul>
        </div>

        {/* Prayer Tools */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="w-12 h-12 bg-[#FFF5F0] rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-tools text-[#FF7E45]" />
          </div>
          <h3 className="text-xl font-bold mb-2">Prayer Tools</h3>
          <p className="text-gray-600 mb-4">
            Practical tools for your prayer journey
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Prayer Journal Template
              </a>
            </li>
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Family Prayer Guide
              </a>
            </li>
            <li>
              <a href="#" className="text-[#FF7E45] hover:text-[#F4B942]">
                Prayer Prompts
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Additional Resources Section */}
      <div className="bg-gray-50 rounded-lg p-8 mt-8">
        <h3 className="text-2xl font-bold mb-4 text-center">
          Additional Resources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold mb-2">Recommended Books</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• "The Power of Prayer" by E.M. Bounds</li>
              <li>
                • "Prayer: Experiencing Awe and Intimacy with God" by Timothy
                Keller
              </li>
              <li>• "The Circle Maker" by Mark Batterson</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">Online Resources</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Prayer apps and digital journals</li>
              <li>• Online prayer communities</li>
              <li>• Video teaching series</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Prayer Meetings Tab Component
  const PrayerMeetingsTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Prayer Meetings & Events</h2>
        <p className="text-gray-600">
          Join us for corporate prayer and fellowship
        </p>
      </div>

      {/* Meeting Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setMeetingFilter("upcoming")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            meetingFilter === "upcoming"
              ? "bg-[#FF7E45] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Upcoming Meetings
        </button>
        <button
          onClick={() => setMeetingFilter("past")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            meetingFilter === "past"
              ? "bg-[#FF7E45] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Past Meetings
        </button>
        <button
          onClick={() => setMeetingFilter("weekly")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            meetingFilter === "weekly"
              ? "bg-[#FF7E45] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Weekly Prayer
        </button>
        <button
          onClick={() => setMeetingFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            meetingFilter === "all"
              ? "bg-[#FF7E45] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Meetings
        </button>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {getFilteredMeetings().length > 0 ? (
          getFilteredMeetings().map((meeting, index) => (
            <div
              key={meeting._id || index}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{meeting.title}</h3>
                  <p className="text-gray-600 mb-3">{meeting.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <i className="fas fa-calendar mr-2" />
                      {formatDate(meeting.startTime || meeting.date)}
                    </span>
                    <span className="flex items-center">
                      <i className="fas fa-clock mr-2" />
                      {formatTime(meeting.startTime || meeting.date)}
                    </span>
                    {meeting.location && (
                      <span className="flex items-center">
                        <i className="fas fa-map-marker-alt mr-2" />
                        {meeting.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-4">
                  <button className="btn btn-primary">
                    {meeting.rsvpAvailable ? "RSVP Now" : "Learn More"}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <i className="fas fa-calendar-times text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">
              {meetingFilter === "upcoming"
                ? "No upcoming prayer meetings scheduled"
                : "No prayer meetings found"}
            </p>
            <button
              className="btn btn-primary mt-4"
              onClick={fetchPrayerMeetings}
            >
              Check Events Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ✅ Prayer Requests Tab Component (Original Content)
  const PrayerRequestsTab = () => (
    <div>
      {/* Submit Prayer Request Card */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Prayer?</h2>
        <p className="text-gray-600 mb-6">
          Our prayer team is committed to lifting up your requests in prayer.
          Submissions can be anonymous if you prefer.
        </p>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          Submit Prayer Request
        </button>
      </div>

      {/* Prayer Requests List */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Requests</h2>
          <div className="text-sm text-gray-500">
            <i className="fas fa-info-circle mr-1" /> Names are kept private
            unless submitted by church staff
          </div>
        </div>

        <div className="space-y-4">
          {prayers.map((prayer) => (
            <div key={prayer.id} className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-700 mb-4">{prayer.request}</p>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{prayer.name}</span> •{" "}
                  {formatDate(prayer.date)}
                  {prayer.isPrivate && (
                    <span className="ml-2 text-[#FF7E45]">
                      <i className="fas fa-lock mr-1" />
                      Private
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handlePrayForRequest(prayer.id)}
                  disabled={prayer.userPrayed}
                  className={`flex items-center ${
                    prayer.userPrayed
                      ? "text-green-500 cursor-default"
                      : "text-[#FF7E45] hover:text-[#F4B942]"
                  }`}
                >
                  <i
                    className={`fas ${prayer.userPrayed ? "fa-check" : "fa-praying-hands"} mr-2`}
                  />
                  <span>Prayed ({prayer.prayerCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => fetchPrayers(page + 1)}
              disabled={isLoading}
              className="btn btn-outline"
            >
              {isLoading ? "Loading..." : "Load More Requests"}
            </button>
          </div>
        )}

        {prayers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <i className="fas fa-pray text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">
              No prayer requests yet. Be the first to share!
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading && prayers.length === 0) {
    return <Loader type="spinner" text="Loading prayer requests..." />;
  }

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Prayer Ministry</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Share your needs, pray for others, and grow in your prayer life
          </p>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Prayer Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* ✅ ADDED: Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex flex-wrap -mb-px">
                  {[
                    {
                      id: "requests",
                      label: "Prayer Requests",
                      icon: "fa-praying-hands",
                    },
                    { id: "team", label: "Prayer Team", icon: "fa-users" },
                    {
                      id: "meetings",
                      label: "Prayer Meetings",
                      icon: "fa-calendar",
                    },
                    {
                      id: "resources",
                      label: "Prayer Resources",
                      icon: "fa-book-open",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? "border-[#FF7E45] text-[#FF7E45]"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <i className={`fas ${tab.icon} mr-2`} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "requests" && <PrayerRequestsTab />}
                {activeTab === "team" && <PrayerTeamTab />}
                {activeTab === "meetings" && <PrayerMeetingsTab />}
                {activeTab === "resources" && <PrayerResourcesTab />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prayer Request Form Modal */}
      {showForm && (
        <PrayerFormModal
          user={user}
          onClose={() => {
            setShowForm(false);
            setSubmitted(false);
            setError(null);
          }}
          onSubmit={handleSubmitPrayer}
          submitted={submitted}
          error={error}
        />
      )}
    </div>
  );
};

// Prayer Form Modal Component (unchanged)
const PrayerFormModal = ({ user, onClose, onSubmit, submitted, error }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Submit Prayer Request</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={onSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Your Prayer Request *
                </label>
                <textarea
                  name="request"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] focus:border-transparent"
                  rows="5"
                  placeholder="Share your prayer need..."
                  required
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input type="checkbox" name="isPrivate" className="mr-2" />
                  <span className="text-gray-700">
                    Keep my request private (only visible to prayer team)
                  </span>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Leave blank to remain anonymous"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Email for Updates (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  defaultValue={user?.email || ""}
                  placeholder="Enter your email"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll notify you when someone prays for your request
                </p>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="notifyOnPray"
                    className="mr-2"
                    defaultChecked
                  />
                  <span className="text-gray-700">
                    Notify me when someone prays for my request
                  </span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 mr-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Prayer
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-check text-green-500 text-2xl" />
              </div>
              <h4 className="text-xl font-bold mb-2">
                Prayer Request Submitted
              </h4>
              <p className="text-gray-600">
                Thank you for sharing your request. Our prayer team will be
                praying for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrayerPage;
