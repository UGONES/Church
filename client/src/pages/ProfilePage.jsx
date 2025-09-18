import React, { useState, useEffect } from "react";
import { apiClient } from '../utils/api';
import { authService, userService, donationService } from '../services/apiService';
import Loader from '../components/Loader';
import { useAlert } from "../utils/Alert";

const ProfilePage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [userData, setUserData] = useState(null);
  const [donations, setDonations] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [favorites, setFavorites] = useState({ events: [], sermons: [], posts: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', relationship: '' });

  const alert = useAlert();

  useEffect(() => {
    document.title = "SMC: - Profile | St. Michael's & All Angels Church | Ifite-Awka";
    fetchUserProfileData();
  }, [user]);

  const fetchUserProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user data based on role
      const userResponse = await authService.getCurrentUser();
      setUserData(userResponse.data || userResponse);

      // Fetch additional data only if user is authenticated
      if (userResponse && !userResponse.error) {
        const [
          donationsResponse,
          rsvpsResponse,
          favoritesResponse,
          familyResponse
        ] = await Promise.allSettled([
          donationService.getUserDonations(),
          apiClient.get('/user/rsvps'),
          apiClient.get('/user/favorites'),
          apiClient.get('/user/family')
        ]);

        if (donationsResponse.status === 'fulfilled') {
          setDonations(donationsResponse.value.donations || donationsResponse.value.data || []);
        }

        if (rsvpsResponse.status === 'fulfilled') {
          setRsvps(rsvpsResponse.value.rsvps || rsvpsResponse.value.data || []);
        }

        if (favoritesResponse.status === 'fulfilled') {
          setFavorites(favoritesResponse.value.favorites || favoritesResponse.value.data || { events: [], sermons: [], posts: [] });
        }

        if (familyResponse.status === 'fulfilled') {
          setFamilyMembers(familyResponse.value.family || familyResponse.value.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Don't set error if it's just an authentication issue
      if (!error.response || error.response.status !== 401) {
        setError('Failed to load profile data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (formData) => {
    try {
      const response = await authService.updateProfile(formData);
      setUserData(response.user || response.data);
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to update profile' 
      };
    }
  };

  const handleAddFamilyMember = async (memberData) => {
    try {
      const response = await apiClient.post('/user/family', memberData);
      const newMember = response.member || response.data;
      setFamilyMembers(prev => [...prev, newMember]);
      setIsAddingFamilyMember(false);
      setNewFamilyMember({ name: '', relationship: '' });
      return { success: true, message: 'Family member added successfully' };
    } catch (error) {
      console.error('Error adding family member:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to add family member' 
      };
    }
  };

  const handleRemoveFamilyMember = async (memberId) => {
    try {
      await apiClient.delete(`/user/family/${memberId}`);
      setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
      return { success: true, message: 'Family member removed successfully' };
    } catch (error) {
      console.error('Error removing family member:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to remove family member' 
      };
    }
  };

  const handleUpdateCommunicationPrefs = async (preferences) => {
    try {
      await apiClient.put('/user/communication', { preferences });
      return { success: true, message: 'Preferences updated successfully' };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to update preferences' 
      };
    }
  };

  const handleChangePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to change password' 
      };
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await authService.deleteAccount();
        window.location.href = '/';
      } catch (error) {
        console.error('Error deleting account:', error);
        setError(error.response?.data?.message || error.message || 'Failed to delete account');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show login prompt if user is not authenticated
  if (!user && !userData) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
              <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
              <a href="/login" className="btn btn-primary">Log In</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loader type="spinner" text="Loading your profile..." />;
  }

  // Determine user role display text
  const getRoleDisplayText = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'user': 'Church Member'
    };
    return roleMap[role] || 'Church Member';
  };

  const currentUser = userData || user;
  const userRole = currentUser.role || 'user';

  return (
    <div className="page">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
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

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#FF7E45] to-[#F4B942] h-32 relative">
              <div className="absolute -bottom-16 left-8">
                <div className="w-32 h-32 bg-gray-300 rounded-full border-4 border-white flex items-center justify-center text-4xl text-white">
                  {currentUser?.name?.charAt(0) || currentUser?.firstName?.charAt(0) || 'U'}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-20 px-8 pb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    {currentUser?.name || `${currentUser?.firstName} ${currentUser?.lastName}` || 'User'}
                  </h1>
                  <p className="text-gray-600">
                    {getRoleDisplayText(userRole)}
                    {userRole !== 'user' && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {userRole}
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  className="btn btn-outline"
                  onClick={() => setActiveTab('personal')}
                >
                  Edit Profile
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-8">
                <ul className="flex flex-wrap -mb-px">
                  {['personal', 'involvement', 'communication', 'account'].map((tab) => (
                    <li key={tab} className="mr-2">
                      <button
                        onClick={() => setActiveTab(tab)}
                        className={`inline-block py-4 px-4 border-b-2 ${
                          activeTab === tab
                            ? 'border-[#FF7E45] text-[#FF7E45] font-medium'
                            : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {tab === 'personal' && 'Personal Information'}
                        {tab === 'involvement' && 'Involvement'}
                        {tab === 'communication' && 'Communication'}
                        {tab === 'account' && 'Account Settings'}
                      </button>
                    </li>
                  ))}
                  
                  {/* Admin-only tab */}
                  {userRole === 'admin' && (
                    <li className="mr-2">
                      <button
                        onClick={() => window.location.href = '/admin'}
                        className="inline-block py-4 px-4 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-300 text-blue-500"
                      >
                        Admin Dashboard
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              {/* Tab Content */}
              {activeTab === 'personal' && (
                <PersonalInfoTab 
                  userData={currentUser}
                  familyMembers={familyMembers}
                  isAddingFamilyMember={isAddingFamilyMember}
                  newFamilyMember={newFamilyMember}
                  onUpdateProfile={handleUpdateProfile}
                  onAddFamilyMember={handleAddFamilyMember}
                  onRemoveFamilyMember={handleRemoveFamilyMember}
                  setIsAddingFamilyMember={setIsAddingFamilyMember}
                  setNewFamilyMember={setNewFamilyMember}
                  formatDate={formatDate}
                />
              )}

              {activeTab === 'involvement' && (
                <InvolvementTab 
                  donations={donations}
                  rsvps={rsvps}
                  favorites={favorites}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              )}

              {activeTab === 'communication' && (
                <CommunicationTab 
                  onUpdatePreferences={handleUpdateCommunicationPrefs}
                />
              )}

              {activeTab === 'account' && (
                <AccountSettingsTab 
                  onChangePassword={handleChangePassword}
                  onDeleteAccount={handleDeleteAccount}
                  userRole={userRole}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Personal Information Tab Component
const PersonalInfoTab = ({ 
  userData, 
  familyMembers, 
  isAddingFamilyMember, 
  newFamilyMember, 
  onUpdateProfile, 
  onAddFamilyMember, 
  onRemoveFamilyMember, 
  setIsAddingFamilyMember, 
  setNewFamilyMember,
  formatDate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || ''
  });

  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    setFormData({
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      address: userData?.address || ''
    });
  }, [userData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onUpdateProfile(formData);
    setSaveStatus(result.success ? 'success' : 'error');
    
    if (result.success) {
      setIsEditing(false);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleAddFamilyMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newFamilyMember.name || !newFamilyMember.relationship) return;
    
    const result = await onAddFamilyMember(newFamilyMember);
    setSaveStatus(result.success ? 'success' : 'error');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div>
      {/* Status Messages */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-600">Operation completed successfully!</p>
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600">Operation failed. Please try again.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#FF7E45] hover:text-[#F4B942] text-sm"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="form-input"
                  rows="3"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <p className="font-medium">
                  {userData?.firstName && userData?.lastName 
                    ? `${userData.firstName} ${userData.lastName}` 
                    : userData?.name || 'Not provided'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email Address</label>
                <p className="font-medium">{userData?.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                <p className="font-medium">{userData?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <p className="font-medium">{userData?.address || 'Not provided'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Church Info */}
        <div>
          <h2 className="text-xl font-bold mb-4">Church Membership</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Member Since</label>
              <p className="font-medium">{userData?.memberSince ? formatDate(userData.memberSince) : 'Not specified'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Membership Status</label>
              <p className="font-medium capitalize">{userData?.membershipStatus || 'Active'}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Small Group</label>
              <p className="font-medium">{userData?.smallGroup || 'Not currently in a small group'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Family Members */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Family Members</h2>
          <button 
            className="btn btn-outline text-sm"
            onClick={() => setIsAddingFamilyMember(true)}
          >
            <i className="fas fa-plus mr-2"></i> Add Family Member
          </button>
        </div>
        
        {isAddingFamilyMember && (
          <form onSubmit={handleAddFamilyMemberSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={newFamilyMember.name}
                  onChange={(e) => setNewFamilyMember({...newFamilyMember, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Relationship</label>
                <select
                  value={newFamilyMember.relationship}
                  onChange={(e) => setNewFamilyMember({...newFamilyMember, relationship: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select Relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn btn-primary text-sm">
                Add Member
              </button>
              <button 
                type="button" 
                className="btn btn-outline text-sm"
                onClick={() => setIsAddingFamilyMember(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        
        {familyMembers.length > 0 ? (
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div key={member.id || member._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{member.relationship}</p>
                </div>
                <button
                  onClick={() => onRemoveFamilyMember(member.id || member._id)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove family member"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 mb-4">No family members linked to your account.</p>
        )}
      </div>
    </div>
  );
};

// Involvement Tab Component
const InvolvementTab = ({ donations, rsvps, favorites, formatCurrency, formatDate }) => {
  return (
    <div className="space-y-8">
      {/* Donations */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your Donations</h2>
        {donations && donations.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Amount</th>
                    <th className="text-left pb-2">Date</th>
                    <th className="text-left pb-2">Type</th>
                    <th className="text-left pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.slice(0, 5).map((donation) => (
                    <tr key={donation.id || donation._id} className="border-b">
                      <td className="py-3 font-medium">{formatCurrency(donation.amount)}</td>
                      <td className="py-3">{formatDate(donation.date || donation.createdAt)}</td>
                      <td className="py-3 capitalize">{donation.frequency || 'One-time'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          donation.status === 'completed' || donation.status === 'succeeded' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {donations.length > 5 && (
              <p className="text-sm text-gray-600 mt-3">
                Showing 5 of {donations.length} donations. <a href="/donations" className="text-[#FF7E45]">View all</a>
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600">You haven't made any donations yet.</p>
            <p className="text-gray-600 mt-2">
              Support our ministry by making a <a href="/donate" className="text-[#FF7E45]">donation</a>.
            </p>
          </div>
        )}
      </div>

      {/* RSVPs */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your Upcoming RSVPs</h2>
        {rsvps && rsvps.length > 0 ? (
          <div className="space-y-3">
            {rsvps.slice(0, 3).map((rsvp) => (
              <div key={rsvp.id || rsvp._id} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium">{rsvp.eventTitle}</h3>
                <p className="text-sm text-gray-600">{formatDate(rsvp.eventDate)}</p>
                <p className="text-sm text-gray-600">{rsvp.eventTime}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600">You haven't RSVP'd to any upcoming events.</p>
            <p className="text-gray-600 mt-2">
              Check our <a href="/events" className="text-[#FF7E45]">events calendar</a> to find upcoming activities.
            </p>
          </div>
        )}
      </div>

      {/* Favorites */}
      <div>
        <h2 className="text-xl font-bold mb-4">Your Favorites</h2>
        {(favorites.events && favorites.events.length > 0) || 
         (favorites.sermons && favorites.sermons.length > 0) || 
         (favorites.posts && favorites.posts.length > 0) ? (
          <div className="space-y-4">
            {favorites.events && favorites.events.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Events ({favorites.events.length})</h3>
                <div className="space-y-2">
                  {favorites.events.slice(0, 2).map((event) => (
                    <div key={event.id || event._id} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {favorites.sermons && favorites.sermons.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Sermons ({favorites.sermons.length})</h3>
                <div className="space-y-2">
                  {favorites.sermons.slice(0, 2).map((sermon) => (
                    <div key={sermon.id || sermon._id} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">{sermon.title}</p>
                      <p className="text-sm text-gray-600">{sermon.speaker}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {favorites.posts && favorites.posts.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Posts ({favorites.posts.length})</h3>
                <div className="space-y-2">
                  {favorites.posts.slice(0, 2).map((post) => (
                    <div key={post.id || post._id} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-gray-600">By {post.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600">You haven't saved any favorites yet.</p>
            <p className="text-gray-600 mt-2">
              Browse our <a href="/sermons" className="text-[#FF7E45]">sermons</a> or{' '}
              <a href="/events" className="text-[#FF7E45]">events</a> and click the heart icon to add items to your favorites.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Communication Tab Component
const CommunicationTab = ({ onUpdatePreferences }) => {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newsletter: true,
    eventReminders: true,
    prayerUpdates: true
  });

  const [saveStatus, setSaveStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onUpdatePreferences(preferences);
    setSaveStatus(result.success ? 'success' : 'error');
    
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Communication Preferences</h2>
      
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-600">Preferences updated successfully!</p>
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600">Failed to update preferences. Please try again.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-medium">Email Notifications</label>
            <p className="text-sm text-gray-600">Receive important updates via email</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
            className="form-checkbox h-5 w-5 text-[#FF7E45]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-medium">SMS Notifications</label>
            <p className="text-sm text-gray-600">Receive text message alerts</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.smsNotifications}
            onChange={(e) => setPreferences({...preferences, smsNotifications: e.target.checked})}
            className="form-checkbox h-5 w-5 text-[#FF7E45]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-medium">Weekly Newsletter</label>
            <p className="text-sm text-gray-600">Receive our weekly church newsletter</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.newsletter}
            onChange={(e) => setPreferences({...preferences, newsletter: e.target.checked})}
            className="form-checkbox h-5 w-5 text-[#FF7E45]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-medium">Event Reminders</label>
            <p className="text-sm text-gray-600">Get reminders for events you RSVP to</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.eventReminders}
            onChange={(e) => setPreferences({...preferences, eventReminders: e.target.checked})}
            className="form-checkbox h-5 w-5 text-[#FF7E45]"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-medium">Prayer Updates</label>
            <p className="text-sm text-gray-600">Receive updates on prayer requests</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.prayerUpdates}
            onChange={(e) => setPreferences({...preferences, prayerUpdates: e.target.checked})}
            className="form-checkbox h-5 w-5 text-[#FF7E45]"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Save Preferences
        </button>
      </form>
    </div>
  );
};

// Account Settings Tab Component
const AccountSettingsTab = ({ onChangePassword, onDeleteAccount, userRole }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords don't match");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long");
      return;
    }
    
    const result = await onChangePassword(passwordData);
    if (result.success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password changed successfully');
    } else {
      setPasswordMessage(result.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Account Settings</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-yellow-800 mb-2">Security</h3>
        <p className="text-yellow-700 text-sm">
          For your security, please keep your password confidential and update it regularly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {passwordMessage && (
          <div className={`p-3 rounded-lg ${
            passwordMessage.includes('success') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {passwordMessage}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-2">Current Password</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            className="form-input"
            required
            minLength="8"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm New Password</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            className="form-input"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Change Password
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-red-600 mb-3">Danger Zone</h3>
        <button 
          className="btn bg-red-500 text-white hover:bg-red-600"
          onClick={onDeleteAccount}
        >
          <i className="fas fa-trash mr-2"></i>
          Delete Account
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This action cannot be undone. All your data will be permanently removed.
        </p>
      </div>

      {/* Admin note */}
      {userRole === 'admin' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Admin Note</h3>
          <p className="text-blue-700 text-sm">
            As an administrator, your account has special privileges. Please be cautious when making changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;