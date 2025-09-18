import React, { useState, useEffect } from "react";
import { ministryService } from "../services/apiService";
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { Ministry } from '../models/Ministry';
import { Volunteer } from '../models/Volunteer';

const MinistriesPage = ({ user }) => {
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

  const isAdmin = user?.role === "admin";
  const isAuthenticated = user?.isLoggedIn;

  useEffect(() => {
    document.title = "SMC: - MInistries | St. Micheal`s & All Angels Church | Ifite-Awka";
    fetchMinistries();
    fetchVolunteerOpportunities();
    if (isAuthenticated) {
      fetchUserMinistries();
    }
    if (isAdmin) {
      fetchMinistryStats();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchMinistries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ministryService.getAll();

      if (response.success) {
        const ministriesData = response.data.map(ministry => new Ministry(ministry));
        setMinistries(ministriesData);
        if (ministriesData.length > 0 && !activeMinistry) {
          setActiveMinistry(ministriesData[0]._id || ministriesData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching ministries:', error);
      setError('Failed to load ministries. Please try again later.');
      alert.error('Failed to load ministries. Please try again later.');
      setMinistries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVolunteerOpportunities = async () => {
    try {
      const response = await ministryService.getVolunteerOpportunities();
      if (response.success) {
        setVolunteerOpportunities(response.data);
      }
    } catch (error) {
      console.error('Error fetching volunteer opportunities:', error);
    }
  };

  const fetchUserMinistries = async () => {
    try {
      const response = await ministryService.getUserMinistries();
      if (response.success) {
        setUserMinistries(response.data);
      }
    } catch (error) {
      console.error('Error fetching user ministries:', error);
    }
  };

  const fetchMinistryStats = async () => {
    try {
      const response = await ministryService.getStats();
      if (response.success) {
        setMinistryStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching ministry stats:', error);
    }
  };

  const fetchMinistryVolunteers = async (ministryId) => {
    try {
      const response = await ministryService.getVolunteers(ministryId);
      if (response.success) {
        setMinistryVolunteers(prev => ({
          ...prev,
          [ministryId]: response.data
        }));
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching ministry volunteers:', error);
      return [];
    }
  };

  const handleVolunteer = async (ministryId, formData) => {
    if (!isAuthenticated) {
      alert.info("Please log in to volunteer");
      return;
    }

    try {
      const volunteerData = new Volunteer({
        ...formData,
        ministryId,
        userId: user?.id
      });

      const response = await ministryService.volunteer(ministryId, volunteerData);

      if (response.success) {
        alert.success(response.message || "Thank you for volunteering! We'll be in touch soon.");
        setShowVolunteerModal(false);
        if (isAdmin) {
          fetchMinistryVolunteers(ministryId);
        }
        // Refresh user ministries after volunteering
        if (isAuthenticated) {
          fetchUserMinistries();
        }
      }
    } catch (error) {
      console.error('Error volunteering:', error);
      alert.error("Failed to submit volunteer request. Please try again.");
    }
  };

  const handleContactLeaders = async (ministryId, message) => {
    try {
      const response = await ministryService.contactLeaders(ministryId, {
        message,
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email
      });

      if (response.success) {
        alert.success(response.message || "Message sent successfully!");
        setShowContactModal(false);
      }
    } catch (error) {
      console.error('Error contacting leaders:', error);
      alert.error("Failed to send message. Please try again.");
    }
  };

  const handleGetInvolved = (ministry) => {
    if (isAuthenticated) {
      setSelectedMinistry(ministry);
      setShowVolunteerModal(true);
    } else {
      alert.info("Please log in to get involved in ministries");
    }
  };

  // Admin functions
  const handleCreateMinistry = async (ministryData) => {
    try {
      const ministry = new Ministry(ministryData);
      const response = await ministryService.create(ministry);

      if (response.success) {
        alert.success('Ministry created successfully');
        fetchMinistries();
        setShowManageModal(false);
      }
    } catch (error) {
      console.error('Error creating ministry:', error);
      alert.error('Failed to create ministry');
    }
  };

  const handleUpdateMinistry = async (ministryId, ministryData) => {
    try {
      const ministry = new Ministry(ministryData);
      const response = await ministryService.update(ministryId, ministry);

      if (response.success) {
        alert.success('Ministry updated successfully');
        fetchMinistries();
        setShowManageModal(false);
        setSelectedMinistry(null);
      }
    } catch (error) {
      console.error('Error updating ministry:', error);
      alert.error('Failed to update ministry');
    }
  };

  const handleDeleteMinistry = async (ministryId) => {
    if (!window.confirm('Are you sure you want to delete this ministry?')) {
      return;
    }

    try {
      const response = await ministryService.delete(ministryId);

      if (response.success) {
        alert.success('Ministry deleted successfully');
        fetchMinistries();
        setShowManageModal(false);
        setSelectedMinistry(null);
      }
    } catch (error) {
      console.error('Error deleting ministry:', error);
      alert.error('Failed to delete ministry');
    }
  };

  const handleViewVolunteers = async (ministry) => {
    setSelectedMinistry(ministry);
    await fetchMinistryVolunteers(ministry._id || ministry.id);
    setShowAdminDashboard(true);
  };

  const handleEditMinistry = (ministry) => {
    setSelectedMinistry(ministry);
    setShowManageModal(true);
  };

  const handleNewMinistry = () => {
    setSelectedMinistry(null);
    setShowManageModal(true);
  };

  const currentMinistry = ministries.find(
    (ministry) => (ministry.id === activeMinistry || ministry._id === activeMinistry)
  );

  if (isLoading) {
    return <Loader type="spinner" text="Loading ministries..." />;
  }

  return (
    <div className="page">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] py-12 px-4">
        <div className="container mx-auto text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Our Ministries</h1>
          <p className="text-xl max-w-2xl mx-auto">
            How we're serving our church family and community
          </p>

          {/* User Ministry Actions */}
          {isAuthenticated && (
            <div className="mt-6 space-x-4">
              <button
                onClick={() => setShowUserMinistries(true)}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-user-check mr-2"></i>
                My Ministries
              </button>
              <button
                onClick={() => setShowVolunteerOpportunities(true)}
                className="bg-white text-[#FF7E45] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-hands-helping mr-2"></i>
                Volunteer Opportunities
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
                Admin Dashboard
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

      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* User Ministries Modal */}
      {showUserMinistries && (
        <UserMinistriesModal
          userMinistries={userMinistries}
          onClose={() => setShowUserMinistries(false)}
        />
      )}

      {/* Volunteer Opportunities Modal */}
      {showVolunteerOpportunities && (
        <VolunteerOpportunitiesModal
          opportunities={volunteerOpportunities}
          onClose={() => setShowVolunteerOpportunities(false)}
          onVolunteer={handleGetInvolved}
        />
      )}

      {/* Ministries Overview */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row">
            {/* Navigation */}
            <div className="md:w-1/4 mb-8 md:mb-0">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">Ministry Areas</h2>
                <ul className="space-y-3">
                  {ministries.map((ministry) => (
                    <li key={ministry._id || ministry.id}>
                      <button
                        className={`w-full text-left px-4 py-3 rounded-md flex items-center ${activeMinistry === (ministry._id || ministry.id)
                            ? "bg-[#FFF5F0] text-[#FF7E45]"
                            : "hover:bg-gray-50"
                          }`}
                        onClick={() => setActiveMinistry(ministry._id || ministry.id)}
                      >
                        <i
                          className={`fas fa-${ministry.icon || 'users'} mr-3 ${activeMinistry === (ministry._id || ministry.id)
                              ? "text-[#FF7E45]"
                              : "text-gray-400"
                            }`}
                        ></i>
                        {ministry.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ministry Details */}
            <div className="md:w-3/4 md:pl-8">
              {currentMinistry && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-64 relative">
                    <img
                      src={currentMinistry.imageUrl || currentMinistry.details?.image || 'https://cdn.pixabay.com/photo/2016/11/14/05/29/children-1822704_1280.jpg'}
                      alt={currentMinistry.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://cdn.pixabay.com/photo/2016/11/14/05/29/children-1822704_1280.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                    <div className="absolute bottom-0 p-6 text-white">
                      <div className="flex items-center mb-2">
                        <i
                          className={`fas fa-${currentMinistry.icon || 'users'} text-[#FF7E45] text-2xl mr-3`}
                        ></i>
                        <h2 className="text-3xl font-bold">{currentMinistry.name}</h2>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                    <p className="text-gray-700 mb-8">
                      {currentMinistry.description || currentMinistry.details?.mission}
                    </p>

                    {currentMinistry.programs?.length > 0 && (
                      <>
                        <h3 className="text-xl font-bold mb-4">Programs & Activities</h3>
                        <div className="space-y-4 mb-8">
                          {currentMinistry.programs.map((program, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-bold mb-2">{program.name}</h4>
                              {program.ages && <p className="text-sm text-gray-600">Ages: {program.ages}</p>}
                              {program.time && <p className="text-sm text-gray-600">When: {program.time}</p>}
                              <p className="text-gray-700">{program.description}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {currentMinistry.volunteerNeeds?.length > 0 && (
                      <>
                        <h3 className="text-xl font-bold mb-4">Volunteer Needs</h3>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {currentMinistry.volunteerNeeds.map((need, idx) => (
                            <span key={idx} className="bg-[#FFF5F0] text-[#FF7E45] px-3 py-1 rounded-full text-sm">
                              {need}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {currentMinistry.leaders?.length > 0 && (
                      <>
                        <h3 className="text-xl font-bold mb-4">Leadership</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                          {currentMinistry.leaders.map((leader, idx) => (
                            <div key={idx} className="flex items-start">
                              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-user text-gray-400 text-xl"></i>
                              </div>
                              <div className="ml-4">
                                <h4 className="font-bold">{leader.name}</h4>
                                <p className="text-sm text-gray-600 mb-1">{leader.title}</p>
                                <p className="text-sm text-gray-700">{leader.bio}</p>
                                {leader.email && (
                                  <p className="text-sm text-[#FF7E45] mt-1">
                                    <i className="fas fa-envelope mr-1"></i>
                                    {leader.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => handleGetInvolved(currentMinistry)}
                        className="bg-[#FF7E45] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FFA76A] transition-colors"
                      >
                        Get Involved <i className="fas fa-arrow-right ml-2"></i>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMinistry(currentMinistry);
                          setShowContactModal(true);
                        }}
                        className="border border-[#FF7E45] text-[#FF7E45] px-6 py-3 rounded-lg font-semibold hover:bg-[#FFF5F0] transition-colors"
                      >
                        Contact Ministry Leaders
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Find Your Place to Serve</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Everyone has unique gifts and talents. We'd love to help you discover how you can use yours to serve others.
          </p>
          <div className="max-w-md mx-auto">
            <button className="bg-[#FF7E45] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#FFA76A] transition-colors w-full">
              Take Our Spiritual Gifts Assessment
            </button>
            <p className="mt-4 text-gray-600">
              Not sure where to start? Contact us at{" "}
              <a href={<ContactModal />} className="text-[#FF7E45] hover:underline">
                serve@church.org
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Modals */}
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
          onSubmit={handleVolunteer}
          user={user}
        />
      )}
    </div>
  );
};

// User Ministries Modal Component
const UserMinistriesModal = ({ userMinistries, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Volunteer for {ministry.name}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Areas of Interest</label>
              <div className="space-y-2">
                {(ministry.volunteerNeeds || []).map((need) => (
                  <label key={need} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(need)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...formData.interests, need]
                          : formData.interests.filter(i => i !== need);
                        setFormData({ ...formData, interests: updated });
                      }}
                      className="mr-2 h-4 w-4 text-[#FF7E45] focus:ring-[#FF7E45]"
                    />
                    {need}
                  </label>
                ))}
              </div>
            </div>

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
                          : formData.availability.filter(a => a !== option);
                        setFormData({ ...formData, availability: updated });
                      }}
                      className="mr-2 h-4 w-4 text-[#FF7E45] focus:ring-[#FF7E45]"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Experience</label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF7E45]"
                placeholder="Tell us about your relevant experience..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Additional Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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