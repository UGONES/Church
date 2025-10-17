import { useState, useEffect, useCallback } from "react";
import { authService, donationService, eventService, volunteerService } from "../services/apiService";
import Loader from "../components/Loader";
import { useAlert } from "../utils/Alert";
import useAuth from "../hooks/useAuth";

const UserPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [volunteerApplications, setVolunteerApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const alert = useAlert();

  useEffect(() => {
    document.title = "SMC - Dashboard | St. Michael's & All Angels Church | Ifite-Awka";
  }, []);

  const Fetch = useCallback(() => {
    if (user?.id) fetchDashboardData();
  }, [user]);

  useEffect(() => {
    Fetch();
  }, [Fetch]);

  const fetchDashboardData = async () => {
    let cancelled = false;
    try {
      setLoading(true);
      setError(null);

      // ✅ Fetch current user properly
      const userResponse = await authService.getCurrentUser();
      if (cancelled) return;

      const userObj = userResponse?.data?.user || userResponse?.user || userResponse;
      setUserData(userObj);

      // ✅ Fetch dashboard data in parallel
      const [
        donationsResponse,
        eventsResponse,
        volunteersResponse
      ] =
        await Promise.allSettled([
          donationService.getUserDonations({ limit: 3 }),
          eventService.getUpcoming({ limit: 3 }),
          volunteerService.getUserApplications(),
        ]);

      if (!cancelled) {
        // ✅ Donations

        if (donationsResponse.status === "fulfilled") {
          const raw = donationsResponse.value?.data?.donations || donationsResponse.value?.data || donationsResponse.value || [];
          setRecentDonations(Array.isArray(raw) ? raw.slice(0, 3) : []);
        }

        // ✅ Events
        if (eventsResponse.status === "fulfilled") {
          const raw = eventsResponse.value?.data?.events || eventsResponse.value?.data || eventsResponse.value || [];
          setUpcomingEvents(Array.isArray(raw) ? raw : []);
        }

        // ✅ Volunteer Applications
        if (volunteersResponse.status === "fulfilled") {
          const raw = volunteersResponse.value?.data?.applications || volunteersResponse.value?.data || volunteersResponse.value || [];
          setVolunteerApplications(Array.isArray(raw) ? raw : []);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
      if (!err.response || err.response.status !== 401) {
        setError("Failed to load dashboard data. Please try again.");
        alert.error?.("Failed to load dashboard data. Please try again.");
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : "N/A";

  const getVolunteerStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      inactive: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs ${statusColors[status] || "bg-gray-100 text-gray-800"
          }`}
      >
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const currentUser = userData || user;
  const userRole = currentUser?.role;

  // ---------- Render Logic ----------
  if (authLoading || loading) {
    return <Loader type="spinner" text="Loading your dashboard..." />;
  }

  if (!user || !user.id) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to view your dashboard.
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



  return (
    <div className="page">
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 text-sm hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {currentUser?.firstName || currentUser?.name || "User"}!
          </h1>
          <p className="text-gray-600">
            {userRole === "admin"
              ? "Administrator Dashboard"
              : userRole === "moderator"
                ? "Moderator Dashboard"
                : "Member Dashboard"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Upcoming Events</span>
                <span className="font-bold">{upcomingEvents.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recent Donations</span>
                <span className="font-bold">{recentDonations.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Volunteer Applications</span>
                <span className="font-bold">{volunteerApplications.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Member Since</span>
                <span className="font-bold">
                  {currentUser?.memberSince ? new Date(currentUser.memberSince).getFullYear() : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href={`/profile/${currentUser.id}`}
                className="block btn btn-outline w-full text-center"
              >
                <i className="fas fa-user mr-2"></i>Edit Profile
              </a>
              <a
                href="/events"
                className="block btn btn-outline w-full text-center"
              >
                <i className="fas fa-calendar mr-2"></i>View Events
              </a>
              <a
                href="/ministries"
                className="block btn btn-outline w-full text-center"
              >
                <i className="fas fa-hands-helping mr-2"></i>Volunteer
              </a>
              <a
                href="/donate"
                className="block btn btn-primary w-full text-center"
              >
                <i className="fas fa-donate mr-2"></i>Make a Donation
              </a>

              {(userRole === "moderator") && (
                <a
                  href="#"
                  className="block btn btn-outline w-full text-center bg-blue-50 border-blue-200"
                >
                  <i className="fas fa-cog mr-2"></i>Moderator Panel
                </a>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
            {recentDonations.length > 0 ? (
              <div className="space-y-3">
                {recentDonations.map((donation) => (
                  <div
                    key={donation.id || donation._id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">Donation</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(donation.date || donation.createdAt)}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(donation.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Volunteer Applications */}
        {volunteerApplications.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Your Volunteer Applications</h2>
              <a
                href="/ministries"
                className="text-[#FF7E45] hover:text-[#F4B942] text-sm"
              >
                View Ministries
              </a>
            </div>

            <div className="space-y-3">
              {volunteerApplications.slice(0, 3).map((application) => (
                <div
                  key={application._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {application.ministryId?.name || "Ministry"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Applied: {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <div className="ml-4">
                    {getVolunteerStatusBadge(application.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Upcoming Events</h2>
            <a
              href={`/my-rsvps/${user.id}`}
              className="text-[#FF7E45] hover:text-[#F4B942] text-sm"
            >
              View All
            </a>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id || event._id}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#FF7E45] rounded-lg flex items-center justify-center text-white font-bold mr-3">
                    {new Date(event.date || event.startTime).getDate()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(event.date || event.startTime)} •{" "}
                      {event.location || "TBA"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <i className="fas fa-calendar-plus text-3xl text-gray-300 mb-3"></i>
              <p className="text-gray-600 mb-4">No upcoming events</p>
              <a href="/events" className="btn btn-outline">
                Browse Events
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPage;
