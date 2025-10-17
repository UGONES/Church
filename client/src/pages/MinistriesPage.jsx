import { useState, useEffect } from "react";
import { ministryService } from "../services/apiService";
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { Ministry } from '../models/Ministry';
import { Volunteer } from '../models/Volunteer';
import { useAuth } from "../hooks/useAuth";

const MinistriesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const alert = useAlert();

  const [activeMinistry, setActiveMinistry] = useState(null);
  const [ministries, setMinistries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);

  const [volunteerOpportunities, setVolunteerOpportunities] = useState([]);
  const [userMinistries, setUserMinistries] = useState([]);
  const [ministryStats, setMinistryStats] = useState(null);
  const [ministryVolunteers, setMinistryVolunteers] = useState({});

  const [showVolunteerOpportunities, setShowVolunteerOpportunities] = useState(false);
  const [showUserMinistries, setShowUserMinistries] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "moderator";
  const isAuthenticated = !!user;


  useEffect(() => {
    document.title = "SMC: - MInistries | St. Micheal`s & All Angels Church | Ifite-Awka";
    fetchMinistries();
    fetchVolunteerOpportunities();
    if (isAdmin) fetchMinistryStats();
  }, [isAdmin]);

  useEffect(() => {
    if (!ministries || ministries.length === 0) return;

    // Derive user ministries automatically from ministries data
    if (isAuthenticated && user && user._id) {
      const joined = ministries.filter((m) =>
        Array.isArray(m.members)
          ? m.members.some(
            (member) =>
              member.user?._id === user._id || member.userId === user._id
          )
          : false
      );
      setUserMinistries(joined);
    }

    // Derive volunteer opportunities automatically
    const availableVolunteers = ministries.filter(
      (m) =>
        Array.isArray(m.volunteerNeeds) &&
        m.volunteerNeeds.length > 0
    );
    setVolunteerOpportunities(availableVolunteers);
  }, [ministries, user, isAuthenticated]);


  const fetchMinistries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Fetching ministries from:", ministryService.getAll);

      const response = await ministryService.getAll();
      console.log("📥 Ministries API Response:", response);

      let ministriesData = [];

      if (Array.isArray(response)) {
        // Direct array
        ministriesData = response;
      } else if (response?.data) {
        // Axios wrapped
        const d = response.data;
        if (Array.isArray(d)) {
          ministriesData = d;
        } else if (Array.isArray(d.ministries)) {
          ministriesData = d.ministries;
        } else if (Array.isArray(d.data)) {
          ministriesData = d.data;
        } else if (d.ministries && typeof d.ministries === "object") {
          ministriesData = Object.values(d.ministries);
        }
      } else if (Array.isArray(response?.ministries)) {
        // Plain object with ministries key
        ministriesData = response.ministries;
      } else {
        console.warn("⚠️ Unknown ministries response shape:", response);
      }

      // Always ensure it’s an array
      if (!Array.isArray(ministriesData)) {
        console.warn("⚠️ Expected ministries array but got:", ministriesData);
        ministriesData = [];
      }

      const processed = ministriesData.map((m) =>
        m instanceof Ministry ? m : new Ministry(m)
      );

      console.log(`✅ Loaded ${processed.length} ministries`);
      setMinistries(processed);

      if (processed.length > 0 && !activeMinistry) {
        setActiveMinistry(processed[0]._id || processed[0].id);
      }
    } catch (err) {
      console.error("❌ Error fetching ministries:", err);
      console.error("❌ Error details:", err.response?.data);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to load ministries. Please try again later.";
      setError(message);
      alert.error(message);
      setMinistries([]);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchVolunteerOpportunities = async () => {
    try {
      const response = await ministryService.getVolunteerOpportunities();
      console.log('📥 Volunteer Opportunities Response:', response); // Debug log

      if (response && response.success) {
        setVolunteerOpportunities(response.data || []);
      } else if (Array.isArray(response)) {
        setVolunteerOpportunities(response);
      } else {
        setVolunteerOpportunities([]);
      }
    } catch (error) {
      console.error('❌ Error fetching volunteer opportunities:', error);
      setVolunteerOpportunities([]);
    }
  };

  const fetchUserMinistries = async () => {
    try {
      const response = await ministryService.getUserMinistries();
      console.log('📥 User Ministries Response:', response); // Debug log

      if (response && response.success) {
        setUserMinistries(response.data || []);
      } else if (Array.isArray(response)) {
        setUserMinistries(response);
      } else {
        setUserMinistries([]);
      }
    } catch (error) {
      console.error('❌ Error fetching user ministries:', error);
      setUserMinistries([]);
    }
  };

  const fetchMinistryStats = async () => {
    try {
      const response = await ministryService.getStats();
      console.log('📥 Ministry Stats Response:', response); // Debug log

      if (response && response.success) {
        setMinistryStats(response.data || {});
      } else if (typeof response === 'object') {
        setMinistryStats(response);
      } else {
        setMinistryStats({});
      }
    } catch (error) {
      console.error('❌ Error fetching ministry stats:', error);
      setMinistryStats({});
    }
  };

  const fetchMinistryVolunteers = async (ministryId) => {
    try {
      const response = await ministryService.getVolunteers(ministryId);
      console.log('📥 Ministry Volunteers Response:', response); // Debug log

      let volunteersData = [];

      if (response && response.success) {
        volunteersData = response.data || [];
      } else if (Array.isArray(response)) {
        volunteersData = response;
      }

      setMinistryVolunteers(prev => ({
        ...prev,
        [ministryId]: volunteersData
      }));

      return volunteersData;
    } catch (error) {
      console.error('❌ Error fetching ministry volunteers:', error);
      const emptyArray = [];
      setMinistryVolunteers(prev => ({
        ...prev,
        [ministryId]: emptyArray
      }));
      return emptyArray;
    }
  };
  /**====================== HANDLERS ====================== */
  const handleVolunteer = async (ministryId, formData) => {
    if (!isAuthenticated) {
      alert.info("Please log in to volunteer");
      return;
    }

    try {
      const volunteerData = new Volunteer({
        ...formData,
        ministryId,
        userId: user?.id || user?._id,
      });

      const response = await ministryService.volunteer(ministryId, volunteerData);
      console.log('📥 Volunteer Response:', response); // Debug log

      if (response && response.success) {
        alert.success(response.message || "Thank you for volunteering! We'll be in touch soon.");
        setShowVolunteerModal(false);
        if (isAdmin) {
          fetchMinistryVolunteers(ministryId);
        }
        if (isAuthenticated) {
          fetchUserMinistries();
        }
      } else {
        throw new Error(response?.message || "Volunteer request failed");
      }
    } catch (error) {
      console.error('❌ Error volunteering:', error);
      alert.error(error.response?.data?.message || "Failed to submit volunteer request. Please try again.");
    }
  };

  const handleContactLeaders = async (ministryId, message) => {
    try {
      const response = await ministryService.contactLeaders(ministryId, {
        message,
        userId: user?.id || user?._id,
        userName: user?.name,
        userEmail: user?.email
      });

      console.log('📥 Contact Leaders Response:', response); // Debug log

      if (response && response.success) {
        alert.success(response.message || "Message sent successfully!");
        setShowContactModal(false);
        setSelectedMinistry(null);
      } else {
        throw new Error(response?.message || "Message sending failed");
      }
    } catch (error) {
      console.error('❌ Error contacting leaders:', error);
      alert.error(error.response?.data?.message || "Failed to send message. Please try again.");
    }
  };

  // ===================== Admin Ministry Management =====================

  const handleCreateMinistry = async (ministryData) => {
    try {
      const cleanPhone = ministryData.contactPhone
        ? ministryData.contactPhone.replace(/[^\d+]/g, "")
        : "";

      const payload = {
        ...ministryData,
        contactPhone: cleanPhone,
        description: ministryData.description,
        contactEmail: ministryData.contactEmail || "",
        missionStatement: ministryData.missionStatement || "",
        visionStatement: ministryData.visionStatement || "",
        status: ministryData.status || "active",
        tags: ministryData.tags || [],
        leaders: ministryData.leaders || [],
        programs: ministryData.programs || [],
        location: ministryData.meetingLocation || "",
        volunteerNeeds: ministryData.volunteerNeeds || [],
        name: ministryData.name,
        icon: ministryData.icon || "users",
        imageUrl: ministryData.imageUrl || "",
        meetingSchedule: ministryData.meetingSchedule || "",
      };

      const response = await ministryService.create(payload);
      console.log('📥 Create Ministry Response:', response); // Debug log

      let newMinistry = response.data?.ministry || response.data?.data || response.data || response;

      if (!newMinistry) {
        throw new Error("No ministry data returned from server");
      }

      // Ensure the new ministry has proper structure
      if (!newMinistry._id && !newMinistry.id) {
        console.warn('⚠️ New ministry missing ID:', newMinistry);
        // If no ID, generate a temporary one for UI
        newMinistry = {
          ...newMinistry,
          _id: `temp-${Date.now()}`,
          id: `temp-${Date.now()}`
        };
      }

      // Update local state immediately
      setMinistries((prev) => [...prev, new Ministry(newMinistry)]);

      // Update active ministry if this is the first one
      if (ministries.length === 0) {
        setActiveMinistry(newMinistry._id || newMinistry.id);
      }

      alert.success("✅ Ministry created successfully!");
      setShowManageModal(false);
      setSelectedMinistry(null);

      // Refresh data from server to ensure consistency
      setTimeout(() => {
        fetchMinistries();
      }, 500);

    } catch (error) {
      console.error("❌ Error creating ministry:", error);
      const message = error.response?.data?.message || error.message || "Failed to create ministry";
      alert.error(message);
    }
  };

  const handleUpdateMinistry = async (ministryId, ministryData) => {
    try {
      const cleanPhone = ministryData.contactPhone
        ? ministryData.contactPhone.replace(/[^\d+]/g, "")
        : "";

      const payload = {
        ...ministryData,
        contactPhone: cleanPhone,
      };

      const response = await ministryService.update(ministryId, payload);
      console.log('📥 Update Ministry Response:', response); // Debug log

      let updatedMinistry = response.data?.ministry || response.data?.data || response.data || response;

      if (!updatedMinistry) {
        throw new Error("No updated ministry data returned from server");
      }

      // Update local state immediately
      setMinistries((prev) =>
        prev.map((m) =>
          (m._id === ministryId || m.id === ministryId) ? new Ministry(updatedMinistry) : m
        )
      );

      alert.success("✅ Ministry updated successfully!");
      setShowManageModal(false);
      setSelectedMinistry(null);

      // Refresh data from server to ensure consistency
      setTimeout(() => {
        fetchMinistries();
      }, 500);

    } catch (error) {
      console.error("❌ Error updating ministry:", error);
      const message = error.response?.data?.message || error.message || "Failed to update ministry";
      alert.error(message);
    }
  };

  const handleDeleteMinistry = async (ministryId) => {
    if (!window.confirm("Are you sure you want to delete this ministry?")) return;

    try {
      const response = await ministryService.delete(ministryId);
      console.log('📥 Delete Ministry Response:', response); // Debug log

      const success = response?.data?.success !== false && response?.status !== 400;

      if (success) {
        // Remove from local state immediately
        setMinistries((prev) =>
          prev.filter((m) => (m._id !== ministryId && m.id !== ministryId))
        );

        // Update active ministry if needed
        if (activeMinistry === ministryId && ministries.length > 1) {
          const remainingMinistries = ministries.filter(m =>
            (m._id !== ministryId && m.id !== ministryId)
          );
          if (remainingMinistries.length > 0) {
            setActiveMinistry(remainingMinistries[0]._id || remainingMinistries[0].id);
          } else {
            setActiveMinistry(null);
          }
        }

        alert.success("🗑️ Ministry deleted successfully!");
        setShowManageModal(false);
        setSelectedMinistry(null);
      } else {
        throw new Error("Failed to delete ministry");
      }
    } catch (error) {
      console.error("❌ Error deleting ministry:", error);
      const message = error.response?.data?.message || error.message || "Failed to delete ministry";
      alert.error(message);
    }
  };

  /** ==============UI HANDLERS ============== */
  const handleGetInvolved = (ministry) => {
    if (!isAuthenticated) {
      alert.info("Please log in to get involved in ministries");
    } else {
      setSelectedMinistry(ministry);
      setShowVolunteerModal(true);
    }
  };

  const handleNewMinistry = () => {
    setSelectedMinistry(null);
    setShowManageModal(true);
  };

  const handleEditMinistry = (ministry) => {
    setSelectedMinistry(ministry);
    setShowManageModal(true);
  };

  const handleViewVolunteers = async (ministry) => {
    setSelectedMinistry(ministry);
    await fetchMinistryVolunteers(ministry._id || ministry.id);
    setShowAdminDashboard(true);
  };

  if (isLoading || authLoading) {
    return <Loader type="spinner" text="Loading ministries..." />;
  }

  const currentMinistry = ministries.find(
    (ministry) => (ministry.id === activeMinistry || ministry._id === activeMinistry)
  );

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Our Ministries</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Serving our church family and community together.
          </p>

          {/* User Ministry Actions */}
          {isAuthenticated && (
            <div className="mt-6 space-x-4">
              <button
                onClick={() => setShowUserMinistries(true)}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-user-check mr-2"></i>
                My Ministries({userMinistries.length})
              </button>
              <button
                onClick={() => setShowVolunteerOpportunities(true)}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-hands-helping mr-2"></i>
                Volunteer Opportunities ({volunteerOpportunities.length})
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="mt-6 space-x-4">
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-chart-bar mr-2"></i>
                Moderator Dashboard
              </button>
              <button
                onClick={handleNewMinistry}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                New Ministry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Error Notice */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchMinistries}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {showUserMinistries && (
        <UserMinistriesModal
          user={user}
          userMinistries={userMinistries}
          onClose={() => setShowUserMinistries(false)}
        />
      )}

      {/* Volunteer Opportunities Modal */}
      {showVolunteerOpportunities && (
        <VolunteerOpportunitiesModal
          user={user}
          opportunities={volunteerOpportunities}
          onSubmit={handleVolunteer}
          onClose={() => setShowVolunteerOpportunities(false)}
          onVolunteer={handleGetInvolved}
        />
      )}

      {/* Ministries Overview */}
      <section className="py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row">
          {/* Navigation */}
          <aside className="md:w-1/4 mb-8 md:mb-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Ministry Areas</h2>
              <ul className="space-y-3">
                {isLoading ? (
                  // Loading state
                  Array.from({ length: 3 }).map((_, index) => (
                    <li key={index}>
                      <div className="w-full px-4 py-3 rounded-md flex items-center animate-pulse">
                        <div className="w-6 h-6 bg-gray-200 rounded-full mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      </div>
                    </li>
                  ))
                ) : ministries.length > 0 ? (
                  // Ministries list
                  ministries.map((ministry) => {
                    const ministryId = ministry._id || ministry.id;
                    const isActive = activeMinistry === ministryId;

                    return (
                      <li key={ministryId}>
                        <button
                          className={`w-full text-left px-4 py-3 rounded-md flex items-center transition-colors duration-200 ${isActive
                            ? "bg-[#FFF5F0] text-[#FF7E45] font-semibold"
                            : "hover:bg-gray-50 text-gray-700"
                            }`}
                          onClick={() => setActiveMinistry(ministryId)}
                        >
                          <i
                            className={`fas fa-${ministry.icon || "users"} mr-3 ${isActive ? "text-[#FF7E45]" : "text-gray-400"
                              }`}
                          ></i>
                          <span className="flex-1 text-left">{ministry.name}</span>
                          {ministry.status && ministry.status !== 'active' && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {ministry.status}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  // Empty state
                  <li>
                    <div className="text-center py-4">
                      <i className="fas fa-hands-helping text-gray-300 text-2xl mb-2"></i>
                      <p className="text-gray-500 italic">No ministries available</p>
                      {isAdmin && (
                        <button
                          onClick={() => setShowManageModal(true)}
                          className="mt-2 text-sm text-[#FF7E45] hover:text-[#F4B942]"
                        >
                          Create first ministry
                        </button>
                      )}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </aside>

          {/* Ministry Details */}
          <main className="md:w-3/4 md:pl-8">
            {isLoading ? (
              // Loading state for ministry details
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-64 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : currentMinistry ? (
              // Ministry details content
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Ministry Banner */}
                <div className="relative h-64">
                  <img
                    src={
                      currentMinistry.imageUrl ||
                      currentMinistry.details?.image ||
                      "https://cdn.pixabay.com/photo/2016/11/14/05/29/children-1822704_1280.jpg"
                    }
                    alt={currentMinistry.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://cdn.pixabay.com/photo/2016/11/14/05/29/children-1822704_1280.jpg";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30"></div>
                  <div className="absolute bottom-0 p-6 text-white">
                    <div className="flex items-center mb-2">
                      <i
                        className={`fas fa-${currentMinistry.icon || "users"} text-[#FF7E45] text-2xl mr-3`}
                      ></i>
                      <h2 className="text-3xl font-bold">
                        {currentMinistry.name}
                      </h2>
                    </div>
                    {currentMinistry.missionStatement && (
                      <p className="text-lg opacity-90 max-w-2xl">
                        {currentMinistry.missionStatement}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ministry Content */}
                <div className="p-6">
                  {/* Mission & Description */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {currentMinistry.description ||
                        currentMinistry.details?.mission ||
                        currentMinistry.missionStatement ||
                        "No mission description available."}
                    </p>
                  </div>

                  {/* Vision Statement */}
                  {currentMinistry.visionStatement && (
                    <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="text-xl font-bold mb-3 text-blue-800">Our Vision</h3>
                      <p className="text-blue-700 leading-relaxed">
                        {currentMinistry.visionStatement}
                      </p>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(currentMinistry.contactEmail || currentMinistry.contactPhone || currentMinistry.meetingSchedule) && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-xl font-bold mb-3">Contact & Meeting Info</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentMinistry.contactEmail && (
                          <div className="flex items-center">
                            <i className="fas fa-envelope text-[#FF7E45] mr-3"></i>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <a
                                href={`mailto:${currentMinistry.contactEmail}`}
                                className="text-[#FF7E45] hover:underline"
                              >
                                {currentMinistry.contactEmail}
                              </a>
                            </div>
                          </div>
                        )}
                        {currentMinistry.contactPhone && (
                          <div className="flex items-center">
                            <i className="fas fa-phone text-[#FF7E45] mr-3"></i>
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <a
                                href={`tel:${currentMinistry.contactPhone}`}
                                className="text-[#FF7E45] hover:underline"
                              >
                                {currentMinistry.contactPhone}
                              </a>
                            </div>
                          </div>
                        )}
                        {currentMinistry.meetingSchedule && (
                          <div className="flex items-center md:col-span-2">
                            <i className="far fa-clock text-[#FF7E45] mr-3"></i>
                            <div>
                              <p className="text-sm text-gray-600">Meeting Schedule</p>
                              <p className="text-gray-700">{currentMinistry.meetingSchedule}</p>
                            </div>
                          </div>
                        )}
                        {currentMinistry.meetingLocation && (
                          <div className="flex items-center md:col-span-2">
                            <i className="fas fa-map-marker-alt text-[#FF7E45] mr-3"></i>
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <p className="text-gray-700">{currentMinistry.meetingLocation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Programs */}
                  {currentMinistry.programs && currentMinistry.programs.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4">Programs & Activities</h3>
                      <div className="space-y-4">
                        {currentMinistry.programs.map((program, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-100"
                          >
                            <h4 className="font-semibold text-gray-800 mb-2">
                              {program.name || "Unnamed Program"}
                            </h4>
                            {program.description && (
                              <p className="text-gray-700 mb-2">{program.description}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              {program.schedule && (
                                <span className="flex items-center">
                                  <i className="far fa-clock mr-1"></i>
                                  {program.schedule}
                                </span>
                              )}
                              {program.location && (
                                <span className="flex items-center">
                                  <i className="fas fa-map-marker-alt mr-1"></i>
                                  {program.location}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Volunteer Needs */}
                  {currentMinistry.volunteerNeeds && currentMinistry.volunteerNeeds.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4">Volunteer Opportunities</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentMinistry.volunteerNeeds.map((need, idx) => (
                          <div
                            key={idx}
                            className="border border-[#FFF5F0] bg-[#FFF5F0] p-4 rounded-lg"
                          >
                            <h4 className="font-semibold text-[#FF7E45] mb-2">
                              {typeof need === 'object' ? need.role : need}
                            </h4>
                            {typeof need === 'object' && need.description && (
                              <p className="text-gray-700 text-sm mb-2">{need.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {typeof need === 'object' && need.timeCommitment && (
                                <span className="bg-white text-[#FF7E45] px-2 py-1 rounded">
                                  ⏱️ {need.timeCommitment}
                                </span>
                              )}
                              {typeof need === 'object' && need.requirements && (
                                <span className="bg-white text-[#FF7E45] px-2 py-1 rounded">
                                  📋 {need.requirements}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leadership */}
                  {currentMinistry.leaders && currentMinistry.leaders.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4">Leadership</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentMinistry.leaders.map((leader, idx) => (
                          <div
                            key={idx}
                            className="flex items-start bg-gray-50 rounded-lg p-4"
                          >
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-user text-gray-400 text-xl"></i>
                            </div>
                            <div className="ml-4 flex-1">
                              <h4 className="font-bold text-gray-800">
                                {leader.user?.name || leader.name || "Unnamed Leader"}
                              </h4>
                              <p className="text-sm text-gray-600 mb-1">
                                {leader.role || leader.title || "Leader"}
                              </p>
                              {leader.isPrimary && (
                                <span className="inline-block bg-[#FF7E45] text-white text-xs px-2 py-1 rounded mb-2">
                                  Primary Leader
                                </span>
                              )}
                              {leader.bio && (
                                <p className="text-sm text-gray-700 mt-2">{leader.bio}</p>
                              )}
                              {leader.user?.email && (
                                <p className="text-sm text-[#FF7E45] mt-2">
                                  <i className="fas fa-envelope mr-1"></i>
                                  {leader.user.email}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags/Categories */}
                  {currentMinistry.tags && currentMinistry.tags.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentMinistry.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {typeof tag === 'object' ? tag.name : tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                    <button
                      onClick={() => handleGetInvolved(currentMinistry)}
                      className="bg-[#FF7E45] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FFA76A] transition-colors flex items-center justify-center"
                    >
                      Get Involved <i className="fas fa-arrow-right ml-2"></i>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMinistry(currentMinistry);
                        setShowContactModal(true);
                      }}
                      className="border border-[#FF7E45] text-[#FF7E45] px-6 py-3 rounded-lg font-semibold hover:bg-[#FFF5F0] transition-colors flex items-center justify-center"
                    >
                      Contact Ministry Leaders
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleEditMinistry(currentMinistry)}
                        className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit Ministry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // No ministry selected state
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <i className="fas fa-hands-helping text-gray-300 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Select a Ministry
                </h3>
                <p className="text-gray-500 mb-4">
                  Choose a ministry from the sidebar to view its details and get involved.
                </p>
                {ministries.length === 0 && isAdmin && (
                  <button
                    onClick={() => setShowManageModal(true)}
                    className="bg-[#FF7E45] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#FFA76A] transition-colors"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create First Ministry
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gray-50 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Find Your Place to Serve</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Everyone has unique gifts and talents. We'd love to help you
            discover how you can use yours to serve others.
          </p>
          <div className="max-w-md mx-auto">
            <button className="bg-[#FF7E45] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FFA76A] transition-colors w-full">
              Take Our Spiritual Gifts Assessment
            </button>
            <p className="mt-4 text-gray-600">
              Not sure where to start? Contact us at{" "}
              <a
                href="mailto:serve@church.org"
                className="text-[#FF7E45] hover:underline"
              >
                serve@church.org
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Global Modals */}
      {showAdminDashboard && (
        <AdminDashboard
          ministries={ministries}
          stats={ministryStats}
          volunteers={ministryVolunteers}
          onClose={() => setShowAdminDashboard(false)}
          onViewVolunteers={handleViewVolunteers}
          onEditMinistry={handleEditMinistry}
        />
      )}

      {showManageModal && (
        <MinistryManagementModal
          ministry={selectedMinistry}
          onClose={() => {
            setShowManageModal(false);
            setSelectedMinistry(null);
          }}
          onCreate={handleCreateMinistry}
          onUpdate={handleUpdateMinistry}
          onDelete={handleDeleteMinistry}
        />
      )}

      {showContactModal && selectedMinistry && (
        <ContactModal
          ministry={selectedMinistry}
          onClose={() => setShowContactModal(false)}
          onSubmit={handleContactLeaders}
          user={user}
        />
      )}

      {showVolunteerModal && selectedMinistry && (
        <VolunteerModal
          ministry={selectedMinistry}
          onClose={() => setShowVolunteerModal(false)}
          // onSubmit={handleVolunteer}
          // user={user}
        />
      )}
    </div>
  );
};

// User Ministries Modal Component
const UserMinistriesModal = ({ userMinistries, onClose }) => {
  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">My Ministries</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {userMinistries.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">You haven't joined any ministries yet.</p>
              <p className="text-gray-500 text-sm mt-2">Explore our ministries and get involved!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMinistries.map((ministry) => (
                <div key={ministry._id || ministry.id} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <i className={`fas fa-${ministry.icon || 'users'} text-[#FF7E45] text-xl mr-3`}></i>
                    <h4 className="font-semibold">{ministry.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{ministry.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#FF7E45]">
                      <i className="fas fa-user-check mr-1"></i>
                      Member
                    </span>
                    <span className="text-sm text-gray-500">
                      Joined: {new Date(ministry.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Volunteer Opportunities Modal Component
const VolunteerOpportunitiesModal = ({ opportunities, onClose, onVolunteer }) => {
  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Volunteer Opportunities</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {opportunities.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-hands-helping text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">No volunteer opportunities available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Check back later for new opportunities!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {opportunities.map((opportunity) => (
                <div key={opportunity._id || opportunity.id} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <i className={`fas fa-${opportunity.icon || 'hands-helping'} text-[#FF7E45] text-xl mr-3`}></i>
                    <h4 className="font-semibold">{opportunity.ministryName}</h4>
                  </div>
                  <h5 className="font-medium text-gray-800 mb-2">{opportunity.role}</h5>
                  <p className="text-sm text-gray-600 mb-3">{opportunity.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <i className="fas fa-clock mr-2"></i>
                      <span>Time commitment: {opportunity.timeCommitment}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <i className="fas fa-calendar mr-2"></i>
                      <span>Duration: {opportunity.duration}</span>
                    </div>
                    {opportunity.skillsRequired && (
                      <div className="flex items-center text-sm text-gray-500">
                        <i className="fas fa-tools mr-2"></i>
                        <span>Skills: {opportunity.skillsRequired.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onVolunteer(opportunity)}
                    className="w-full bg-[#FF7E45] text-white py-2 rounded-lg hover:bg-[#FFA76A] transition-colors"
                  >
                    <i className="fas fa-hand-paper mr-2"></i>
                    Volunteer Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ ministries, stats, volunteers, onClose, onViewVolunteers, onEditMinistry }) => {
  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">Ministry Admin Dashboard</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalMinistries}</div>
                <div className="text-sm text-blue-800">Total Ministries</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalVolunteers}</div>
                <div className="text-sm text-green-800">Total Volunteers</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</div>
                <div className="text-sm text-orange-800">Pending Requests</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Manage Ministries</h4>
            {ministries.map(ministry => (
              <div key={ministry._id || ministry.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-semibold">{ministry.name}</h5>
                    <p className="text-sm text-gray-600">{ministry.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewVolunteers(ministry)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      <i className="fas fa-users mr-1"></i>
                      Volunteers ({volunteers[ministry._id || ministry.id]?.length || 0})
                    </button>
                    <button
                      onClick={() => onEditMinistry(ministry)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Ministry Management Modal Component
const MinistryManagementModal = ({ ministry, onClose, onCreate, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    name: ministry?.name || '',
    description: ministry?.description || '',
    icon: ministry?.icon || 'users',
    imageUrl: ministry?.imageUrl || '',
    volunteerNeeds: ministry?.volunteerNeeds?.join(', ') || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      volunteerNeeds: formData.volunteerNeeds.split(',').map(item => item.trim()).filter(Boolean)
    };

    if (ministry) {
      onUpdate(ministry._id || ministry.id, submitData);
    } else {
      onCreate(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">
            {ministry ? 'Edit Ministry' : 'Create New Ministry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ministry Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Icon Name</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                placeholder="users, heart, hands-helping"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Volunteer Needs (comma-separated)</label>
              <input
                type="text"
                value={formData.volunteerNeeds}
                onChange={(e) => setFormData({ ...formData, volunteerNeeds: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                placeholder="Teaching, Music, Hospitality"
              />
            </div>
            <div className="flex justify-between space-x-3">
              {ministry && (
                <button
                  type="button"
                  onClick={() => onDelete(ministry._id || ministry.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete
                </button>
              )}
              <div className="flex space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#FFA76A] transition-colors"
                >
                  {ministry ? 'Update' : 'Create'} Ministry
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Contact Modal Component
const ContactModal = ({ ministry, onClose, onSubmit, user }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(ministry._id || ministry.id, message);
  };

  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Contact {ministry.name} Leaders</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                placeholder="What would you like to ask or share with the ministry leaders?"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#FFA76A] transition-colors"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Volunteer Modal Component
const VolunteerModal = ({ ministry, onClose, onSubmit, user }) => {
  const [formData, setFormData] = useState({
    interests: [],
    availability: [],
    experience: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(ministry._id || ministry.id, formData);
  };

  const availabilityOptions = ["Weekdays", "Weekends", "Mornings", "Afternoons", "Evenings"];

  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Volunteer for {ministry.name}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fix: Safely render volunteer needs whether they are strings or objects */}
            <div>
              <label className="block text-sm font-medium mb-2">Areas of Interest</label>
              <div className="space-y-2">
                {(ministry.volunteerNeeds || []).map((need, idx) => {
                  const labelText = typeof need === "string" ? need : need.role || "Volunteer";
                  return (
                    <label key={idx} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(labelText)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...formData.interests, labelText]
                            : formData.interests.filter((i) => i !== labelText);
                          setFormData({ ...formData, interests: updated });
                        }}
                        className="mr-2 h-4 w-4 text-[#FF7E45] focus:ring-[#FF7E45]"
                      />
                      {labelText}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium mb-2">Availability</label>
              <div className="space-y-2">
                {availabilityOptions.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.availability.includes(option)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...formData.availability, option]
                          : formData.availability.filter((a) => a !== option);
                        setFormData({ ...formData, availability: updated });
                      }}
                      className="mr-2 h-4 w-4 text-[#FF7E45] focus:ring-[#FF7E45]"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium mb-2">Experience</label>
              <textarea
                value={formData.experience}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                placeholder="Tell us about your relevant experience..."
              />
            </div>

            {/* Additional Message */}
            <div>
              <label className="block text-sm font-medium mb-2">Additional Message</label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                placeholder="Anything else you'd like to share..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FF7E45] text-white rounded-lg hover:bg-[#FFA76A] transition-colors"
              >
                Submit Interest
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MinistriesPage;