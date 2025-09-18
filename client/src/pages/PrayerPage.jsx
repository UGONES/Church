import React, { useState, useEffect } from "react";
import { apiClient } from '../utils/api';
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { PrayerRequest } from '../models/PrayerRequest';

const PrayerPage = ({ user }) => {
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

  const isAdmin = user?.role === "admin";
  const isAuthenticated = user?.isLoggedIn;

  useEffect(() => {
    document.title = "SMC: - Prayers | St. Micheal`s & All Angels Church | Ifite-Awka";
    fetchPrayers();
    fetchPrayerTeam();
    fetchPrayerMeetings();
    if (isAdmin) {
      fetchPrayerStats();
    }
  }, []);

  const fetchPrayers = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/prayers?page=${pageNum}&limit=10`);
      if (response.success) {
        const prayersData = response.data.prayers.map(prayer => new PrayerRequest(prayer));
        setPrayers(prev => pageNum === 1 ? prayersData : [...prev, ...prayersData]);
        setHasMore(response.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching prayers:', error);
      setError('Failed to load prayer requests. Please try again later.');
      alert.error('Failed to load prayer requests. Please try again later.');
      setPrayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPrayerTeam = async () => {
    try {
      const response = await apiClient.get('/api/prayers/team');
      if (response.success) {
        setPrayerTeam(response.data);
      }
    } catch (error) {
      console.error('Error fetching prayer team:', error);
    }
  };

  const fetchPrayerMeetings = async () => {
    try {
      const response = await apiClient.get('/api/prayers/meetings');
      if (response.success) {
        setPrayerMeetings(response.data);
      }
    } catch (error) {
      console.error('Error fetching prayer meetings:', error);
    }
  };

  const fetchPrayerStats = async () => {
    try {
      const response = await apiClient.get('/api/admin/prayers/stats');
      if (response.success) {
        setPrayerStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching prayer stats:', error);
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
      notifyOnPray: formData.get("notifyOnPray") === "on"
    };

    try {
      const response = await apiClient.post('/api/prayers', prayerData);
      
      if (response.success) {
        setSubmitted(true);
        fetchPrayers(1);
        setTimeout(() => {
          setShowForm(false);
          setSubmitted(false);
        }, 3000);
        alert.success('Prayer request submitted successfully!');
      } else {
        setError(response.message || "Failed to submit prayer request");
        alert.error(response.message || "Failed to submit prayer request");
      }
    } catch (error) {
      console.error('Error submitting prayer:', error);
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
      const response = await apiClient.post(`/api/prayers/${prayerId}/pray`);
      
      if (response.success) {
        setPrayers(prev => prev.map(prayer => 
          prayer._id === prayerId 
            ? { ...prayer, prayerCount: (prayer.prayerCount || 0) + 1, userPrayed: true }
            : prayer
        ));
        alert.success('Thank you for praying!');
      } else {
        alert.error(response.message || "Failed to record your prayer");
      }
    } catch (error) {
      console.error('Error praying for request:', error);
      alert.error("Failed to record your prayer. Please try again.");
    }
  };

   // Admin functions
  const handleUpdatePrayer = async (prayerId, updates) => {
    try {
      const response = await apiClient.put(`/api/prayers/${prayerId}`, updates);
      if (response.success) {
        alert.success('Prayer request updated successfully');
        fetchPrayers();
      }
    } catch (error) {
      console.error('Error updating prayer:', error);
      alert.error('Failed to update prayer request');
    }
  };

  const handleDeletePrayer = async (prayerId) => {
    try {
      const response = await apiClient.delete(`/api/prayers/${prayerId}`);
      if (response.success) {
        alert.success('Prayer request deleted successfully');
        fetchPrayers();
      }
    } catch (error) {
      console.error('Error deleting prayer:', error);
      alert.error('Failed to delete prayer request');
    }
  };

  const fetchAllPrayers = async () => {
    try {
      const response = await apiClient.get('/api/admin/prayers');
      if (response.success) {
        return response.data.map(prayer => new PrayerRequest(prayer));
      }
    } catch (error) {
      console.error('Error fetching all prayers:', error);
    }
  };
  
  const loadMorePrayers = () => {
    fetchPrayers(page + 1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading && prayers.length === 0) {
    return <Loader type="spinner" text="Loading prayer requests..." />;
  }

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Prayer Requests</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Share your needs and pray for others in our community
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
          <div className="max-w-4xl mx-auto">
            {/* Submit Prayer Request Card */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Need Prayer?</h2>
              <p className="text-gray-600 mb-6">
                Our prayer team is committed to lifting up your requests in
                prayer. Submissions can be anonymous if you prefer.
              </p>
              <button 
                onClick={() => setShowForm(true)} 
                className="btn btn-primary"
              >
                Submit Prayer Request
              </button>
            </div>

            {/* Prayer Requests List */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Recent Requests</h2>
                <div className="text-sm text-gray-500">
                  <i className="fas fa-info-circle mr-1"></i> Names are kept
                  private unless submitted by church staff
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
                            <i className="fas fa-lock mr-1"></i>Private
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
                        <i className={`fas ${prayer.userPrayed ? "fa-check" : "fa-praying-hands"} mr-2`}></i>
                        <span>Prayed ({prayer.prayerCount})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <button 
                    onClick={loadMorePrayers}
                    disabled={isLoading}
                    className="btn btn-outline"
                  >
                    {isLoading ? "Loading..." : "Load More Requests"}
                  </button>
                </div>
              )}

              {prayers.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <i className="fas fa-pray text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600">No prayer requests yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Prayer Ministry Info */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Our Prayer Ministry</h2>
              <p className="text-gray-600">
                Learn more about how we pray together as a church
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prayer Team */}
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-[#FFF5F0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-[#FF7E45] text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Prayer Team</h3>
                <p className="text-gray-600 mb-4">
                  Our dedicated prayer team commits to praying for all submitted
                  requests throughout the week.
                </p>
                <a
                  href="/prayer-team"
                  className="text-[#FF7E45] hover:text-[#F4B942] font-medium"
                >
                  Join the Prayer Team <i className="fas fa-arrow-right ml-1"></i>
                </a>
              </div>

              {/* Prayer Meetings */}
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-[#FFF5F0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-alt text-[#FF7E45] text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Prayer Meetings</h3>
                <p className="text-gray-600 mb-4">
                  Join us for corporate prayer every Tuesday at 6:30 PM in the
                  sanctuary or online.
                </p>
                <a
                  href="/events?category=prayer"
                  className="text-[#FF7E45] hover:text-[#F4B942] font-medium"
                >
                  Prayer Calendar <i className="fas fa-arrow-right ml-1"></i>
                </a>
              </div>

              {/* Prayer Resources */}
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-[#FFF5F0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-book-open text-[#FF7E45] text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Prayer Resources</h3>
                <p className="text-gray-600 mb-4">
                  Access guides, devotionals, and tools to help deepen your
                  prayer life.
                </p>
                <a
                  href="/resources/prayer"
                  className="text-[#FF7E45] hover:text-[#F4B942] font-medium"
                >
                  View Resources <i className="fas fa-arrow-right ml-1"></i>
                </a>
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

// Prayer Form Modal Component
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
              <i className="fas fa-times"></i>
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
                ></textarea>
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    name="isPrivate" 
                    className="mr-2" 
                  />
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
                    defaultChecked={true}
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
                <i className="fas fa-check text-green-500 text-2xl"></i>
              </div>
              <h4 className="text-xl font-bold mb-2">Prayer Request Submitted</h4>
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