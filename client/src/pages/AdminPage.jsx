import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminService,
  userService,
  eventService,
  sermonService,
  donationService,
  testimonialService,
  prayerService,
  blogService,
  utilityService,
  ministryService
} from '../services/apiService';
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { useForm } from '../hooks/useForm';
import useAuth from '../hooks/useAuth';

/*====================================== Reusable Components ======================================*/

// StatCard Component
const StatCard = ({ title, value, change, changeType, icon, iconBgColor, iconTextColor }) => (
  <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <p className="text-xs md:text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-xl md:text-3xl font-bold">{value}</h3>
        <p className={`text-xs ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'} mt-1 md:mt-2`}>
          <i className={`fas ${changeType === 'increase' ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
          {change}
        </p>
      </div>
      <div className={`w-8 h-8 md:w-12 md:h-12 ${iconBgColor} rounded-full flex items-center justify-center ml-2`}>
        <i className={`fas ${icon} ${iconTextColor} text-lg md:text-xl`}></i>
      </div>
    </div>
  </div>
);


// SidebarButton Component
const SidebarButton = ({ label, icon, tabName, activeTab, onClick }) => (
  <li>
    <button
      className={`w-full text-left px-4 py-2 rounded-md flex items-center ${activeTab === tabName ? 'bg-[#FF7E45] text-white' : 'hover:bg-gray-100'}`}
      onClick={() => onClick(tabName)}
      aria-current={activeTab === tabName ? 'page' : undefined}
      aria-label={`${label} tab`}
    >
      <i className={`${icon} mr-3`} aria-hidden="true"></i>
      <span>{label}</span>
    </button>
  </li>
);


// ActivityItem Component
const ActivityItem = ({ icon, bgColor, text, time }) => (
  <div className="flex items-start">
    <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="font-medium">{text}</p>
      <p className="text-sm text-gray-500">{time}</p>
    </div>
  </div>
);

// DataTable Component
const DataTable = ({ columns, data, onEdit, onDelete, emptyMessage, actions = true }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b">
            {columns.map(column => (
              <th key={column.key} className="py-3 px-4 text-left">
                {column.title}
              </th>
            ))}
            {actions && <th className="py-3 px-4 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map(item => (
              <tr key={item._id || item.id} className="border-b">
                {columns.map(column => (
                  <td key={column.key} className="py-3 px-4">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-gray-500 hover:text-[#FF7E45] mr-2"
                      aria-label={`Edit ${item.title || item.name}`}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="text-gray-500 hover:text-red-500"
                      aria-label={`Delete ${item.title || item.name}`}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={actions ? columns.length + 1 : columns.length} className="py-4 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

const TabContentWrapper = ({ children, activeTab, tabName }) => {
  const [hasBeenActive, setHasBeenActive] = useState(false);
  const [localState, setLocalState] = useState({});

  // Reset local state when tab becomes inactive
  useEffect(() => {
    if (activeTab === tabName && !hasBeenActive) {
      setHasBeenActive(true);
    } else if (activeTab !== tabName && hasBeenActive) {
      // Store current state before deactivating
      setLocalState({});
      setHasBeenActive(false);
    }
  }, [activeTab, tabName, hasBeenActive]);

  // Only render content if tab is active or has been active recently
  if (activeTab !== tabName && !hasBeenActive) {
    return null;
  }

  return (
    <div className={activeTab !== tabName ? 'hidden' : ''}>
      {children}
    </div>
  );
};

/* ====================================== Components for Each Tab ====================================== */

// Users Management Component
const UsersManagement = ({ users = [], onUpdateUser, onDeleteUser, onCreateUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  const { values, handleChange, setValues, resetForm } = useForm({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
    address: '',
    notes: ''
  });

  // Normalize user status
  const getNormalizedStatus = (status) => {
    if (status === true) return 'active';
    if (status === false) return 'inactive';
    const validStatuses = ['active', 'inactive', 'suspended'];
    const normalized = (status || '').toString().toLowerCase();
    return validStatuses.includes(normalized) ? normalized : 'inactive';
  };

  // Prefill form when editing
  useEffect(() => {
    if (showCreateModal && selectedUser) {
      setValues({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        role: selectedUser.role || 'user',
        status: getNormalizedStatus(selectedUser.status),
        joinDate: selectedUser.joinDate ? new Date(selectedUser.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        address: selectedUser.address || '',
        notes: selectedUser.notes || ''
      });
    } else if (showCreateModal && !selectedUser) {
      resetForm();
    }
  }, [showCreateModal, selectedUser, setValues, resetForm]);

  // Filter users
  const filteredUsers = users
    .map((user) => ({
      ...user,
      status: getNormalizedStatus(user.status),
    }))
    .filter((user) => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedValues = {
        ...values,
        status: getNormalizedStatus(values.status),
      };

      let result;
      if (selectedUser) {
        result = await onUpdateUser(selectedUser._id, normalizedValues);
      } else {
        result = await onCreateUser(normalizedValues);
      }

      if (result.success) {
        alert.success(`User ${selectedUser ? 'updated' : 'created'} successfully`);
        setShowCreateModal(false);
        setSelectedUser(null);
        resetForm();
      } else {
        alert.error(result.message || `Failed to ${selectedUser ? 'update' : 'create'} user`);
      }
    } catch (error) {
      console.error('User operation error:', error);
      alert.error(`Failed to ${selectedUser ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  // User table columns
  const userColumns = [
    {
      key: 'user',
      title: 'User',
      render: (user) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">
              Joined: {new Date(user.createdAt || user.joinDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'email', title: 'Email' },
    {
      key: 'role',
      title: 'Role',
      render: (user) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
          user.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
            user.role === 'staff' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
          }`}>
          {user.role}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (user) => {
        const normalized = getNormalizedStatus(user.status);
        const colorMap = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-yellow-100 text-yellow-800',
          suspended: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[normalized]}`}>
            {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      {/* Header + Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input flex-1 min-w-[200px]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
            <option value="volunteer">Volunteer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={() => {
              setSelectedUser(null);
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
            disabled={loading}
          >
            <i className="fas fa-plus mr-2"></i> New User
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          columns={userColumns}
          data={filteredUsers}
          onEdit={(user) => {
            setSelectedUser(user);
            setShowCreateModal(true);
          }}
          onDelete={(user) => onDeleteUser(user._id)}
          emptyMessage="No users found matching your criteria"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        title={selectedUser ? 'Edit User' : 'Create New User'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name*</label>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email*</label>
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Join Date</label>
              <input
                type="date"
                name="joinDate"
                value={values.joinDate}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role*</label>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                className="form-input"
                required
                disabled={loading}
              >
                <option value="user">User</option>
                <option value="volunteer">Volunteer</option>
                <option value="staff">Staff</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status*</label>
              <select
                name="status"
                value={values.status}
                onChange={handleChange}
                className="form-input"
                required
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              name="address"
              value={values.address}
              onChange={handleChange}
              className="form-input"
              rows="2"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              value={values.notes}
              onChange={handleChange}
              className="form-input"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setSelectedUser(null);
                resetForm();
              }}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : selectedUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Ministries Management Component
const MinistriesManagement = ({ ministries = [], users = [], onUpdateMinistry, onDeleteMinistry, onCreateMinistry }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [ministryCategories, setMinistryCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  const { values, handleChange, resetForm, setValues } = useForm({
    name: "",
    description: "",
    missionStatement: "",
    visionStatement: "",
    icon: "users",
    imageUrl: "",
    leaders: [],
    programs: [],
    volunteerNeeds: [],
    contactEmail: "",
    contactPhone: "",
    meetingSchedule: "",
    meetingLocation: "",
    status: "active",
    tags: [],
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: ""
    }
  });

  // ✅ Default categories for fallback
  const DEFAULT_CATEGORIES = [];

  // ✅ Fetch existing categories - FIXED
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await ministryService.getCategories();
        let categories = [];

        if (response && response.data) {
          categories = response.data.categories || response.data.data || response.data;
        } else if (response) {
          categories = response.categories || response;
        }

        if (Array.isArray(categories)) {
          categories = categories
            .filter((cat) => {
              if (cat == null) return false;
              if (typeof cat === "string") return cat.trim().length > 0;
              if (typeof cat === "object" && cat.name) return cat.name.trim().length > 0;
              return false;
            })
            .map((cat) =>
              typeof cat === "string" ? cat.trim() : cat.name?.trim() || ""
            );
        } else {
          categories = [];
        }

        if (categories.length === 0) categories = [...DEFAULT_CATEGORIES];
        setMinistryCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setMinistryCategories([...DEFAULT_CATEGORIES]);
        if (error.response?.status !== 500) {
          alert.error("Failed to load categories. Using default categories.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // ✅ Prefill form when editing - FIXED
  useEffect(() => {
    if (showCreateModal && selectedMinistry) {
      setValues({
        name: selectedMinistry.name || "",
        description: selectedMinistry.description || "",
        missionStatement: selectedMinistry.missionStatement || "",
        visionStatement: selectedMinistry.visionStatement || "",
        icon: selectedMinistry.icon || "users",
        imageUrl: selectedMinistry.imageUrl || "",
        leaders:
          selectedMinistry.leaders?.map((leader) => ({
            user: leader.user?._id || leader.user || "",
            role: leader.role || "",
            isPrimary: leader.isPrimary || false,
          })) || [],
        programs: selectedMinistry.programs || [],
        volunteerNeeds: selectedMinistry.volunteerNeeds || [],
        contactEmail: selectedMinistry.contactEmail || "",
        contactPhone: selectedMinistry.contactPhone || "",
        meetingSchedule: selectedMinistry.meetingSchedule || "",
        meetingLocation: selectedMinistry.meetingLocation || "",
        status: selectedMinistry.status || "active",
        tags: selectedMinistry.tags || [],
        socialMedia: selectedMinistry.socialMedia || {
          facebook: "",
          instagram: "",
          twitter: "",
          youtube: "",
        },
      });
    } else if (showCreateModal && !selectedMinistry) {
      resetForm();
    }
  }, [showCreateModal, selectedMinistry]);

  // ✅ Add new category - FIXED
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      alert.warning("Please enter a category name.");
      return;
    }

    const categoryName = newCategory.trim();

    // Check for duplicate locally
    if (ministryCategories.some(cat =>
      cat.toLowerCase() === categoryName.toLowerCase()
    )) {
      alert.warning("Category already exists.");
      return;
    }

    try {
      setLoading(true);

      // Try to save to server first
      try {
        const response = await ministryService.createCategory({ name: categoryName });
        console.log('✅ Category saved to server:', response);
      } catch (serverError) {
        console.log('⚠️ Server save failed, saving locally only:', serverError.message);
        // Continue with local state update even if server fails
      }

      // Update local state
      setMinistryCategories(prev => [...prev, categoryName]);
      alert.success(`✅ Category "${categoryName}" added successfully!`);
      setNewCategory("");

    } catch (error) {
      console.error("❌ Error adding category:", error);
      alert.error("Failed to add category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter ministries - FIXED
  const filteredMinistries = ministries.filter((ministry) => {
    const matchesSearch = ministry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ministry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ministry.status === statusFilter;
    const matchesCategory = categoryFilter === "all" ||
      (ministry.tags && ministry.tags.some(tag =>
        (typeof tag === 'string' ? tag : tag.name) === categoryFilter
      ));
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // ✅ Form submit handler - FIXED
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submissionData = {
        name: values.name?.trim(),
        description: values.description?.trim(),
        missionStatement: values.missionStatement?.trim() || "",
        visionStatement: values.visionStatement?.trim() || "",
        icon: values.icon || "users",
        imageUrl: values.imageUrl?.trim() || "",
        leaders: (values.leaders || []).filter(l => l.user),
        programs: (values.programs || []).filter(p => p.name && p.description),
        volunteerNeeds: (values.volunteerNeeds || []).filter(v => v.role && v.description),
        contactEmail: values.contactEmail?.trim() || "",
        contactPhone: values.contactPhone?.trim() || "",
        meetingSchedule: values.meetingSchedule?.trim() || "",
        meetingLocation: values.meetingLocation?.trim() || "",
        status: values.status || "active",
        tags: (values.tags || []).filter(tag => tag && tag.trim()),
      };

      console.log('📤 Submitting ministry data:', submissionData);

      let result;
      if (selectedMinistry) {
        result = await onUpdateMinistry(selectedMinistry._id, submissionData);
      } else {
        result = await onCreateMinistry(submissionData);
      }

      if (result?.success) {
        alert.success(result.message || "Ministry saved successfully!");
        setShowCreateModal(false);
        setSelectedMinistry(null);
        resetForm();
      } else {
        alert.error(result?.message || "Something went wrong.");
      }

    } catch (error) {
      console.error("Error saving ministry:", error);
      alert.error(error.response?.data?.message || "Failed to save ministry.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Leader management functions
  const addLeader = () => {
    setValues(prev => ({
      ...prev,
      leaders: [...prev.leaders, { user: "", role: "", isPrimary: false }]
    }));
  };

  const removeLeader = (index) => {
    const updatedLeaders = [...values.leaders];
    updatedLeaders.splice(index, 1);
    setValues(prev => ({ ...prev, leaders: updatedLeaders }));
  };

  const updateLeader = (index, field, value) => {
    const updatedLeaders = [...values.leaders];
    updatedLeaders[index] = { ...updatedLeaders[index], [field]: value };

    // If setting as primary, ensure only one primary leader
    if (field === 'isPrimary' && value === true) {
      updatedLeaders.forEach((leader, i) => {
        if (i !== index) leader.isPrimary = false;
      });
    }

    setValues(prev => ({ ...prev, leaders: updatedLeaders }));
  };

  // ✅ Program management functions
  const addProgram = () => {
    setValues(prev => ({
      ...prev,
      programs: [...prev.programs, { name: "", description: "", schedule: "", location: "" }]
    }));
  };

  const removeProgram = (index) => {
    const updatedPrograms = [...values.programs];
    updatedPrograms.splice(index, 1);
    setValues(prev => ({ ...prev, programs: updatedPrograms }));
  };

  const updateProgram = (index, field, value) => {
    const updatedPrograms = [...values.programs];
    updatedPrograms[index] = { ...updatedPrograms[index], [field]: value };
    setValues(prev => ({ ...prev, programs: updatedPrograms }));
  };

  // ✅ Volunteer needs management functions
  const addVolunteerNeed = () => {
    setValues(prev => ({
      ...prev,
      volunteerNeeds: [...prev.volunteerNeeds, {
        role: "",
        description: "",
        requirements: "",
        timeCommitment: "",
        isActive: true
      }]
    }));
  };

  const removeVolunteerNeed = (index) => {
    const updatedNeeds = [...values.volunteerNeeds];
    updatedNeeds.splice(index, 1);
    setValues(prev => ({ ...prev, volunteerNeeds: updatedNeeds }));
  };

  const updateVolunteerNeed = (index, field, value) => {
    const updatedNeeds = [...values.volunteerNeeds];
    updatedNeeds[index] = { ...updatedNeeds[index], [field]: value };
    setValues(prev => ({ ...prev, volunteerNeeds: updatedNeeds }));
  };

  // ✅ Tag management functions
  const addTag = () => {
    setValues(prev => ({
      ...prev,
      tags: [...prev.tags, ""]
    }));
  };

  const removeTag = (index) => {
    const updatedTags = [...values.tags];
    updatedTags.splice(index, 1);
    setValues(prev => ({ ...prev, tags: updatedTags }));
  };

  const updateTag = (index, value) => {
    const updatedTags = [...values.tags];
    updatedTags[index] = value;
    setValues(prev => ({ ...prev, tags: updatedTags }));
  };

  // ✅ Filter potential leaders (staff, moderators, admins, volunteers)
  const potentialLeaders = users.filter(
    user => ["admin", "moderator", "staff", "volunteer"].includes(user.role) &&
      (user.status === "active" || user.status === true)
  );

  // ✅ Ministry table columns
  const ministryColumns = [
    {
      key: "name",
      title: "Ministry Name",
      render: (ministry) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <i className={`fas fa-${ministry.icon || 'users'} text-gray-600`}></i>
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold">{ministry.name}</div>
            <div className="text-xs text-gray-500">
              Created: {ministry.createdAt ? new Date(ministry.createdAt).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "leaders",
      title: "Leaders",
      render: (ministry) => (
        <div className="text-sm">
          {ministry.leaders && ministry.leaders.length > 0 ? (
            ministry.leaders.slice(0, 2).map((leader, index) => (
              <div key={index} className="truncate">
                {leader.user?.name || 'Unknown'} {leader.isPrimary && '(Primary)'}
              </div>
            ))
          ) : (
            "No leaders"
          )}
          {ministry.leaders && ministry.leaders.length > 2 && (
            <div className="text-xs text-gray-500">
              +{ministry.leaders.length - 2} more
            </div>
          )}
        </div>
      ),
    },
    {
      key: "tags",
      title: "Categories",
      render: (ministry) => (
        <div className="flex flex-wrap gap-1">
          {ministry.tags && ministry.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {typeof tag === 'object' ? tag.name : tag}
            </span>
          ))}
          {ministry.tags && ministry.tags.length > 2 && (
            <span className="text-xs text-gray-500">
              +{ministry.tags.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (ministry) => {
        const statusColors = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-yellow-100 text-yellow-800",
          planning: "bg-blue-100 text-blue-800",
        };
        const status = ministry.status || 'active';
        return (
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      key: "volunteers",
      title: "Volunteer Needs",
      render: (ministry) => (
        <span className="text-sm">
          {ministry.volunteerNeeds?.length || 0}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* ======= Header and Filters ======= */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Ministries Management</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search ministries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input flex-1 min-w-[200px]"
            disabled={loading}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
            disabled={loading}
          >
            <option value="all">All Categories</option>
            {ministryCategories.map((category, index) => (
              <option key={index} value={typeof category === 'object' ? category.name : category}>
                {typeof category === 'object' ? category.name : category}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
            disabled={loading}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="planning">Planning</option>
          </select>
          <button
            onClick={() => {
              setSelectedMinistry(null);
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
            disabled={loading}
          >
            <i className="fas fa-plus mr-2"></i> New Ministry
          </button>
        </div>
      </div>

      {/* ======= Statistics Cards ======= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Ministries"
          value={ministries.length}
          change=""
          changeType="increase"
          icon="fa-hands-helping"
          iconBgColor="bg-blue-100"
          iconTextColor="text-blue-500"
        />
        <StatCard
          title="Active"
          value={ministries.filter(m => m.status === 'active').length}
          change=""
          changeType="increase"
          icon="fa-check"
          iconBgColor="bg-green-100"
          iconTextColor="text-green-500"
        />
        <StatCard
          title="Categories"
          value={ministryCategories.length}
          change=""
          changeType="increase"
          icon="fa-tags"
          iconBgColor="bg-purple-100"
          iconTextColor="text-purple-500"
        />
        <StatCard
          title="Volunteer Needs"
          value={ministries.reduce((total, ministry) => total + (ministry.volunteerNeeds?.length || 0), 0)}
          change=""
          changeType="increase"
          icon="fa-users"
          iconBgColor="bg-orange-100"
          iconTextColor="text-orange-500"
        />
      </div>

      {/* ======= Data Table ======= */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          columns={ministryColumns}
          data={filteredMinistries}
          onEdit={(ministry) => {
            setSelectedMinistry(ministry);
            setShowCreateModal(true);
          }}
          onDelete={(ministry) => onDeleteMinistry(ministry._id)}
          emptyMessage="No ministries found matching your criteria"
        />
      </div>

      {/* ======= Create/Edit Ministry Modal ======= */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedMinistry(null);
          resetForm();
        }}
        title={selectedMinistry ? "Edit Ministry" : "Create New Ministry"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ministry Name*</label>
                <input
                  type="text"
                  name="name"
                  value={values.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="form-input"
                  required
                  placeholder="Enter ministry name"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status*</label>
                <select
                  name="status"
                  value={values.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="form-input"
                  required
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="planning">Planning</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Description*</label>
              <textarea
                name="description"
                value={values.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="form-input"
                rows="3"
                required
                placeholder="Describe the purpose and activities of this ministry..."
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mission Statement</label>
                <textarea
                  name="missionStatement"
                  value={values.missionStatement}
                  onChange={(e) => handleChange('missionStatement', e.target.value)}
                  className="form-input"
                  rows="2"
                  placeholder="The mission of this ministry..."
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vision Statement</label>
                <textarea
                  name="visionStatement"
                  value={values.visionStatement}
                  onChange={(e) => handleChange('visionStatement', e.target.value)}
                  className="form-input"
                  rows="2"
                  placeholder="The vision for this ministry..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Categories/Tags */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Categories & Tags</h3>

            {/* Create New Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Create New Category</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-input flex-1"
                  placeholder="Enter new category name"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="btn btn-outline"
                  disabled={loading || !newCategory.trim()}
                >
                  {loading ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </div>

            {/* Existing Categories */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Available Categories</label>
              <div className="flex flex-wrap gap-2">
                {ministryCategories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {typeof category === 'object' ? category.name : category}
                  </span>
                ))}
                {ministryCategories.length === 0 && (
                  <span className="text-gray-500 text-sm">No categories yet. Add one above.</span>
                )}
              </div>
            </div>

            {/* Ministry Tags */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Pick A Category</label>
                <button
                  type="button"
                  onClick={addTag}
                  className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
                  disabled={loading}
                >
                  + Add Tag
                </button>
              </div>
              {values.tags.map((tag, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    className="form-input flex-1"
                    placeholder="Enter tag"
                    list="categorySuggestions"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    disabled={loading}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
              <datalist id="categorySuggestions">
                {ministryCategories.map((category, index) => (
                  <option key={index} value={typeof category === 'object' ? category.name : category} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Leadership */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Leadership</h3>
            <div className="space-y-4">
              {values.leaders.map((leader, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded border">
                  <select
                    value={leader.user}
                    onChange={(e) => updateLeader(index, 'user', e.target.value)}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Select Leader</option>
                    {potentialLeaders.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Role"
                    value={leader.role}
                    onChange={(e) => updateLeader(index, 'role', e.target.value)}
                    className="form-input"
                    disabled={loading}
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={leader.isPrimary}
                        onChange={(e) => updateLeader(index, 'isPrimary', e.target.checked)}
                        className="form-checkbox"
                        disabled={loading}
                      />
                      <span className="ml-2 text-sm">Primary</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeLeader(index)}
                      className="text-red-500 hover:text-red-700 ml-auto"
                      disabled={loading}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addLeader}
                className="btn btn-outline"
                disabled={loading}
              >
                <i className="fas fa-plus mr-2"></i> Add Leader
              </button>
            </div>
          </div>

          {/* Programs */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Programs & Activities</h3>
            <div className="space-y-4">
              {values.programs.map((program, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 p-4 bg-white rounded border">
                  <input
                    type="text"
                    placeholder="Program Name"
                    value={program.name}
                    onChange={(e) => updateProgram(index, 'name', e.target.value)}
                    className="form-input"
                    disabled={loading}
                  />
                  <textarea
                    placeholder="Description"
                    value={program.description}
                    onChange={(e) => updateProgram(index, 'description', e.target.value)}
                    className="form-input"
                    rows="2"
                    disabled={loading}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Schedule"
                      value={program.schedule}
                      onChange={(e) => updateProgram(index, 'schedule', e.target.value)}
                      className="form-input"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={program.location}
                      onChange={(e) => updateProgram(index, 'location', e.target.value)}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProgram(index)}
                    className="text-red-500 hover:text-red-700 self-start"
                    disabled={loading}
                  >
                    <i className="fas fa-trash mr-2"></i> Remove Program
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addProgram}
                className="btn btn-outline"
                disabled={loading}
              >
                <i className="fas fa-plus mr-2"></i> Add Program
              </button>
            </div>
          </div>

          {/* Volunteer Needs */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Volunteer Needs</h3>
            <div className="space-y-4">
              {values.volunteerNeeds.map((need, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 p-4 bg-white rounded border">
                  <input
                    type="text"
                    placeholder="Role Title"
                    value={need.role}
                    onChange={(e) => updateVolunteerNeed(index, 'role', e.target.value)}
                    className="form-input"
                    disabled={loading}
                  />
                  <textarea
                    placeholder="Role Description"
                    value={need.description}
                    onChange={(e) => updateVolunteerNeed(index, 'description', e.target.value)}
                    className="form-input"
                    rows="2"
                    disabled={loading}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Requirements"
                      value={need.requirements}
                      onChange={(e) => updateVolunteerNeed(index, 'requirements', e.target.value)}
                      className="form-input"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      placeholder="Time Commitment"
                      value={need.timeCommitment}
                      onChange={(e) => updateVolunteerNeed(index, 'timeCommitment', e.target.value)}
                      className="form-input"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVolunteerNeed(index)}
                    className="text-red-500 hover:text-red-700 self-start"
                    disabled={loading}
                  >
                    <i className="fas fa-trash mr-2"></i> Remove Role
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addVolunteerNeed}
                className="btn btn-outline"
                disabled={loading}
              >
                <i className="fas fa-plus mr-2"></i> Add Volunteer Role
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={values.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="form-input"
                  placeholder="ministry@church.org"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  className="form-input"
                  value={values.contactPhone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d+]/g, "");
                    handleChange("contactPhone", clean);
                  }}
                  placeholder="+2349012345678 or 09012345678"
                />

              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Meeting Schedule</label>
                <input
                  type="text"
                  name="meetingSchedule"
                  value={values.meetingSchedule}
                  onChange={(e) => handleChange('meetingSchedule', e.target.value)}
                  className="form-input"
                  placeholder="Every Tuesday at 7:00 PM"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meeting Location</label>
                <input
                  type="text"
                  name="meetingLocation"
                  value={values.meetingLocation}
                  onChange={(e) => handleChange('meetingLocation', e.target.value)}
                  className="form-input"
                  placeholder="Main Sanctuary"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setSelectedMinistry(null);
                resetForm();
              }}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : selectedMinistry ? "Update Ministry" : "Create Ministry"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Testimonials Management Component
const TestimonialsManagement = ({ testimonials, onUpdateTestimonial, onDeleteTestimonial, onCreateTestimonial }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const alert = useAlert();

  const { values, handleChange, setValues, resetForm } = useForm({
    author: '',
    content: '',
    status: 'pending',
    videoUrl: '',
    imageUrl: '',
    category: 'general',
    featured: false,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (selectedTestimonial) {
      setValues({
        author: selectedTestimonial.author || '',
        content: selectedTestimonial.content || '',
        status: selectedTestimonial.status || 'pending',
        videoUrl: selectedTestimonial.videoUrl || '',
        imageUrl: selectedTestimonial.imageUrl || '',
        category: selectedTestimonial.category || 'general',
        featured: selectedTestimonial.featured || false,
        date: selectedTestimonial.date ? new Date(selectedTestimonial.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
  }, [selectedTestimonial, setValues]);

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = testimonial.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || testimonial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTestimonial) {
        await onUpdateTestimonial(selectedTestimonial._id, values);
      } else {
        await onCreateTestimonial(values);
      }
      setShowCreateModal(false);
      setSelectedTestimonial(null);
      resetForm();
      alert.success(`Testimonial ${selectedTestimonial ? 'updated' : 'created'} successfully`);
    } catch (error) {
      alert.error(`Failed to ${selectedTestimonial ? 'update' : 'create'} testimonial`);
    }
  };

  const testimonialColumns = [
    {
      key: 'author',
      title: 'Author',
      render: (testimonial) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
            {testimonial.author?.charAt(0)?.toUpperCase() || 'T'}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{testimonial.author}</div>
            <div className="text-sm text-gray-500">Created: {new Date(testimonial.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      )
    },
    {
      key: 'content',
      title: 'Content',
      render: (testimonial) => (
        <p className="text-sm text-gray-700 line-clamp-2">{testimonial.content}</p>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (testimonial) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${testimonial.status === 'published'
          ? 'bg-green-100 text-green-800'
          : testimonial.status === 'pending'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
          }`}>
          {testimonial.status}
        </span>
      )
    },
    {
      key: 'featured',
      title: 'Featured',
      render: (testimonial) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${testimonial.featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {testimonial.featured ? 'Yes' : 'No'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Testimonials Management</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input flex-1 min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => {
              setSelectedTestimonial(null);
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <i className="fas fa-plus mr-2"></i> New Testimonial
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          columns={testimonialColumns}
          data={filteredTestimonials}
          onEdit={(testimonial) => {
            setSelectedTestimonial(testimonial);
            setShowCreateModal(true);
          }}
          onDelete={(testimonial) => onDeleteTestimonial(testimonial._id)}
          emptyMessage="No testimonials found matching your criteria"
        />
      </div>

      {/* Create/Edit Testimonial Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTestimonial(null);
          resetForm();
        }}
        title={selectedTestimonial ? 'Edit Testimonial' : 'Create New Testimonial'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Author Name*</label>
              <input
                type="text"
                name="author"
                value={values.author}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category"
                value={values.category}
                onChange={handleChange}
                className="form-input"
              >
                <option value="general">General</option>
                <option value="salvation">Salvation</option>
                <option value="healing">Healing</option>
                <option value="provision">Provision</option>
                <option value="relationship">Relationship</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Testimonial Content*</label>
            <textarea
              name="content"
              value={values.content}
              onChange={handleChange}
              className="form-input"
              rows="4"
              required
              placeholder="Share your story of how God has worked in your life..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status*</label>
              <select
                name="status"
                value={values.status}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={values.date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Video URL</label>
              <input
                type="url"
                name="videoUrl"
                value={values.videoUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://youtube.com/embed/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={values.imageUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://example.com/testimonial-image.jpg"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="featured"
              checked={values.featured}
              onChange={(e) => handleChange({ target: { name: 'featured', value: e.target.checked } })}
              className="form-checkbox h-4 w-4 text-[#FF7E45]"
              id="featuredTestimonial"
            />
            <label htmlFor="featuredTestimonial" className="ml-2 text-sm font-medium">
              Feature this testimonial on the homepage
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setSelectedTestimonial(null);
                resetForm();
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedTestimonial ? 'Update' : 'Create'} Testimonial
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Blog Management Component
const BlogManagement = ({ posts, onUpdatePost, onDeletePost, onCreatePost }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [blogCategories, setBlogCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const alert = useAlert();

  const { values, handleChange, setValues, resetForm } = useForm({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    status: 'draft',
    category: '',
    tags: [],

    featuredImage: '',
    publishedAt: new Date().toISOString().split('T')[0],
    metaTitle: '',
    metaDescription: '',
    featured: false
  });

  useEffect(() => {
    if (selectedPost) {
      setValues({
        title: selectedPost.title || '',
        content: selectedPost.content || '',
        excerpt: selectedPost.excerpt || '',
        author: selectedPost.author || '',
        status: selectedPost.status || 'draft',
        category: selectedPost.category || '',
        tags: selectedPost.tags || [],
        featuredImage: selectedPost.featuredImage || '',
        publishedAt: selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        metaTitle: selectedPost.metaTitle || '',
        metaDescription: selectedPost.metaDescription || '',
        featured: selectedPost.featured || false
      });
    }
  }, [selectedPost, setValues]);

  useEffect(() => {
    // Fetch blog categories
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.BLOG.CATEGORIES);
        setBlogCategories(response.categories || []);
      } catch (error) {
        console.error('Error fetching blog categories:', error);
      }
    };

    // Fetch potential authors (users with appropriate roles)
    const fetchAuthors = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.USERS.BASE);
        const authorUsers = response.users.filter(user =>
          ['admin', 'moderator', 'staff'].includes(user.role) && user.status === 'active'
        );
        setAuthors(authorUsers);
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };

    fetchCategories();
    fetchAuthors();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    const matchesAuthor = authorFilter === 'all' || post.author === authorFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesAuthor;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPost) {
        await onUpdatePost(selectedPost._id, values);
      } else {
        await onCreatePost(values);
      }
      setShowCreateModal(false);
      setSelectedPost(null);
      resetForm();
      alert.success(`Blog post ${selectedPost ? 'updated' : 'created'} successfully`);
    } catch (error) {
      alert.error(`Failed to ${selectedPost ? 'update' : 'create'} blog post`);
    }
  };

  const addTag = () => {
    setValues({
      ...values,
      tags: [...values.tags, '']
    });
  };

  const removeTag = (index) => {
    const updatedTags = [...values.tags];
    updatedTags.splice(index, 1);
    setValues({ ...values, tags: updatedTags });
  };

  const updateTag = (index, value) => {
    const updatedTags = [...values.tags];
    updatedTags[index] = value;
    setValues({ ...values, tags: updatedTags });
  };

  const postColumns = [
    {
      key: 'title',
      title: 'Title',
      render: (post) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{post.title}</div>
          <div className="text-sm text-gray-500">By {post.authorName} on {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</div>
        </div>
      )
    },
    { key: 'category', title: 'Category' },
    {
      key: 'status',
      title: 'Status',
      render: (post) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${post.status === 'published'
          ? 'bg-green-100 text-green-800'
          : post.status === 'draft'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
          }`}>
          {post.status}
        </span>
      )
    },
    {
      key: 'featured',
      title: 'Featured',
      render: (post) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${post.featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {post.featured ? 'Yes' : 'No'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Blog Management</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input flex-1 min-w-[200px]"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Categories</option>
            {blogCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Authors</option>
            {authors.map(author => (
              <option key={author._id} value={author._id}>{author.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSelectedPost(null);
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <i className="fas fa-plus mr-2"></i> New Post
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          columns={postColumns}
          data={filteredPosts}
          onEdit={(post) => {
            setSelectedPost(post);
            setShowCreateModal(true);
          }}
          onDelete={(post) => onDeletePost(post._id)}
          emptyMessage="No blog posts found matching your criteria"
        />
      </div>

      {/* Create/Edit Blog Post Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedPost(null);
          resetForm();
        }}
        title={selectedPost ? 'Edit Blog Post' : 'Create New Blog Post'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title*</label>
            <input
              type="text"
              name="title"
              value={values.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Author*</label>
              <select
                name="author"
                value={values.author}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select an author</option>
                {authors.map(author => (
                  <option key={author._id} value={author._id}>{author.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category*</label>
              <select
                name="category"
                value={values.category}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select a category</option>
                {blogCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status*</label>
              <select
                name="status"
                value={values.status}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Publish Date</label>
              <input
                type="date"
                name="publishedAt"
                value={values.publishedAt}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Excerpt</label>
            <textarea
              name="excerpt"
              value={values.excerpt}
              onChange={handleChange}
              className="form-input"
              rows="2"
              placeholder="Brief summary of the post (displayed in listings)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content*</label>
            <textarea
              name="content"
              value={values.content}
              onChange={handleChange}
              className="form-input"
              rows="8"
              required
              placeholder="Write your blog post content here..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Tags</label>
              <button
                type="button"
                onClick={addTag}
                className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
              >
                + Add Tag
              </button>
            </div>
            {values.tags.map((tag, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="text"
                  placeholder="Tag"
                  value={tag}
                  onChange={(e) => updateTag(index, e.target.value)}
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Featured Image URL</label>
              <input
                type="url"
                name="featuredImage"
                value={values.featuredImage}
                onChange={handleChange}
                className="form-input"
                placeholder="https://example.com/featured-image.jpg"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={values.featured}
                onChange={(e) => handleChange({ target: { name: 'featured', value: e.target.checked } })}
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="featuredPost"
              />
              <label htmlFor="featuredPost" className="ml-2 text-sm font-medium">
                Feature this post
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Title (SEO)</label>
            <input
              type="text"
              name="metaTitle"
              value={values.metaTitle}
              onChange={handleChange}
              className="form-input"
              placeholder="Optional: Custom title for search engines"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Description (SEO)</label>
            <textarea
              name="metaDescription"
              value={values.metaDescription}
              onChange={handleChange}
              className="form-input"
              rows="2"
              placeholder="Optional: Custom description for search engines"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setSelectedPost(null);
                resetForm();
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedPost ? 'Update' : 'Create'} Post
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Donations Management Component
const DonationsManagement = ({ donations, onUpdateDonation }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredDonations = donations.filter(donation => {
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || donation.paymentMethod === methodFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      matchesDate = new Date(donation.createdAt).toDateString() === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(donation.createdAt) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(donation.createdAt) >= monthAgo;
    } else if (dateFilter === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      matchesDate = new Date(donation.createdAt) >= yearAgo;
    }

    return matchesStatus && matchesMethod && matchesDate;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const donationColumns = [
    {
      key: 'donor',
      title: 'Donor',
      render: (donation) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{donation.donorName || 'Anonymous'}</div>
          <div className="text-sm text-gray-500">{donation.donorEmail || 'No email provided'}</div>
        </div>
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (donation) => formatCurrency(donation.amount)
    },
    {
      key: 'date',
      title: 'Date',
      render: (donation) => new Date(donation.createdAt).toLocaleDateString()
    },
    {
      key: 'method',
      title: 'Method',
      render: (donation) => donation.paymentMethod ? donation.paymentMethod.charAt(0).toUpperCase() + donation.paymentMethod.slice(1) : 'Unknown'
    },
    {
      key: 'type',
      title: 'Type',
      render: (donation) => donation.recurring ? 'Recurring' : 'One-time'
    },
    {
      key: 'status',
      title: 'Status',
      render: (donation) => (
        <select
          value={donation.status}
          onChange={(e) => onUpdateDonation(donation._id, { status: e.target.value })}
          className="form-input text-sm"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      )
    },
  ];

  const totalAmount = filteredDonations.reduce((sum, donation) => sum + donation.amount, 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Donations Management</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Methods</option>
            <option value="credit_card">Credit Card</option>
            <option value="paypal">PayPal</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn btn-primary">
            <i className="fas fa-download mr-2"></i> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Total: {formatCurrency(totalAmount)}</h3>
            <p className="text-sm text-gray-500">{filteredDonations.length} donations</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Recurring donations</p>
            <p className="font-semibold">
              {formatCurrency(filteredDonations.filter(d => d.recurring).reduce((sum, d) => sum + d.amount, 0))}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          columns={donationColumns}
          data={filteredDonations}
          onEdit={() => { }}
          onDelete={() => { }}
          emptyMessage="No donations found matching your criteria"
        />
      </div>
    </div>
  );
};

// Prayer Requests Management Component
const PrayerRequestsManagement = ({ prayerRequests, onUpdatePrayerRequest, onDeletePrayerRequest }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [privacyFilter, setPrivacyFilter] = useState('all');

  const filteredPrayerRequests = prayerRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
    const matchesPrivacy = privacyFilter === 'all' ||
      (privacyFilter === 'public' && request.isPublic) ||
      (privacyFilter === 'private' && !request.isPublic);
    return matchesStatus && matchesCategory && matchesPrivacy;
  });

  const prayerColumns = [
    {
      key: 'name',
      title: 'Name',
      render: (request) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{request.name || 'Anonymous'}</div>
          <div className="text-sm text-gray-500">{request.email || 'No email provided'}</div>
        </div>
      )
    },
    {
      key: 'request',
      title: 'Request',
      render: (request) => (
        <div className="text-sm text-gray-900 line-clamp-2">{request.request}</div>
      )
    },
    { key: 'category', title: 'Category' },
    {
      key: 'privacy',
      title: 'Privacy',
      render: (request) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${request.isPublic ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}>
          {request.isPublic ? 'Public' : 'Private'}
        </span>
      )
    },
    { key: 'prayerCount', title: 'Prayers' },
    {
      key: 'status',
      title: 'Status',
      render: (request) => (
        <select
          value={request.status}
          onChange={(e) => onUpdatePrayerRequest(request._id, { status: e.target.value })}
          className="form-input text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="answered">Answered</option>
          <option value="rejected">Rejected</option>
        </select>
      )
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Prayer Requests Management</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="answered">Answered</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Categories</option>
            <option value="healing">Healing</option>
            <option value="guidance">Guidance</option>
            <option value="financial">Financial</option>
            <option value="relationship">Relationship</option>
            <option value="thanksgiving">Thanksgiving</option>
            <option value="other">Other</option>
          </select>
          <select
            value={privacyFilter}
            onChange={(e) => setPrivacyFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Privacy</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          columns={prayerColumns}
          data={filteredPrayerRequests}
          onEdit={() => { }}
          onDelete={(request) => onDeletePrayerRequest(request._id)}
          emptyMessage="No prayer requests found matching your criteria"
        />
      </div>
    </div>
  );
};

// Event Form Modal Component
const EventFormModal = ({ isOpen, onClose, onSubmit, eventData = {}, users }) => {
  const { values, handleChange, setValues } = useForm({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    address: {},
    category: 'service',
    imageSource: 'url',
    imageFile: null,
    imageUrl: '',
    capacity: 0,
    requiresRSVP: false,
    price: 0,
    leaders: [],
    tags: [],
    ...eventData
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "imageFile" && value) {
        formData.append("image", value);
      } else if (key !== "imageSource") {
        formData.append(key, value);
      }
    });

    onSubmit(formData);
  };


  const addLeader = () => {
    setValues({
      ...values,
      leaders: [...values.leaders, { userId: '', role: '' }]
    });
  };

  const removeLeader = (index) => {
    const updatedLeaders = [...values.leaders];
    updatedLeaders.splice(index, 1);
    setValues({ ...values, leaders: updatedLeaders });
  };

  const updateLeader = (index, field, value) => {
    const updatedLeaders = [...values.leaders];
    updatedLeaders[index][field] = value;
    setValues({ ...values, leaders: updatedLeaders });
  };

  const addTag = () => {
    setValues({
      ...values,
      tags: [...values.tags, '']
    });
  };

  const removeTag = (index) => {
    const updatedTags = [...values.tags];
    updatedTags.splice(index, 1);
    setValues({ ...values, tags: updatedTags });
  };

  const updateTag = (index, value) => {
    const updatedTags = [...values.tags];
    updatedTags[index] = value;
    setValues({ ...values, tags: updatedTags });
  };

  useEffect(() => {
    if (isOpen) {
      document.querySelector('.form-input')?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter users who can be leaders (staff, moderators, admins, volunteers)
  const potentialLeaders = users.filter(user =>
    ['admin', 'moderator', 'staff', 'volunteer'].includes(user.role) && user.status === 'active'
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventData._id ? 'Edit Event' : 'Create Event'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Title*</label>
            <input
              type="text"
              name="title"
              value={values.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category*</label>
            <select
              name="category"
              value={values.category}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="service">Service</option>
              <option value="bible-study">Bible Study</option>
              <option value="prayer">Prayer Meeting</option>
              <option value="youth">Youth</option>
              <option value="children">Children</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="fellowship">Fellowship</option>
              <option value="outreach">Outreach</option>
              <option value="training">Training</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time*</label>
            <input
              type="datetime-local"
              name="startTime"
              value={values.startTime}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time*</label>
            <input
              type="datetime-local"
              name="endTime"
              value={values.endTime}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location*</label>
          <input
            type="text"
            name="location"
            value={values.location}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={values.capacity}
              onChange={handleChange}
              className="form-input"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input
              type="number"
              name="price"
              value={values.price}
              onChange={handleChange}
              className="form-input"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description*</label>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            className="form-input"
            rows="3"
            required
          />
        </div>

        {/* 📸 Event Image Upload / URL */}
        <div>
          <label className="block text-sm font-medium mb-1">Event Image</label>

          {/* Tabs for Upload Method */}
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="radio"
                name="imageSource"
                value="file"
                checked={values.imageSource === "file"}
                onChange={() => setValues({ ...values, imageSource: "file", imageUrl: "" })}
                className="form-radio text-[#FF7E45]"
              />
              <span>Upload from device</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="radio"
                name="imageSource"
                value="url"
                checked={values.imageSource === "url"}
                onChange={() => setValues({ ...values, imageSource: "url", imageFile: null })}
                className="form-radio text-[#FF7E45]"
              />
              <span>Use image link</span>
            </label>
          </div>

          {/* Conditional Field */}
          {values.imageSource === "file" ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setValues({ ...values, imageFile: file, imageUrl: URL.createObjectURL(file) });
                  }
                }}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-3 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-[#FF7E45] file:text-white hover:file:bg-[#F4B942]"
              />
              {values.imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img
                    src={values.imageUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                type="url"
                name="imageUrl"
                value={values.imageUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://example.com/image.jpg"
              />
              {values.imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img
                    src={values.imageUrl}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg border"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="requiresRSVP"
            checked={values.requiresRSVP}
            onChange={handleChange}
            className="form-checkbox h-4 w-4 text-[#FF7E45]"
            id="requiresRSVP"
          />
          <label htmlFor="requiresRSVP" className="ml-2 text-sm font-medium">
            Requires RSVP
          </label>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Event Leaders</label>
            <button
              type="button"
              onClick={addLeader}
              className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
            >
              + Add Leader
            </button>
          </div>
          {values.leaders.map((leader, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <select
                value={leader.userId}
                onChange={(e) => updateLeader(index, 'userId', e.target.value)}
                className="form-input"
              >
                <option value="">Select a leader</option>
                {potentialLeaders.map(user => (
                  <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
                ))}
              </select>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Role"
                  value={leader.role}
                  onChange={(e) => updateLeader(index, 'role', e.target.value)}
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeLeader(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Tags</label>
            <button
              type="button"
              onClick={addTag}
              className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
            >
              + Add Tag
            </button>
          </div>
          {values.tags.map((tag, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                placeholder="Tag"
                value={tag}
                onChange={(e) => updateTag(index, e.target.value)}
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {eventData._id ? 'Update' : 'Create'} Event
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Sermon Form Modal Component
const SermonFormModal = ({ isOpen, onClose, onSubmit, sermonData = {}, users }) => {
  const { values, handleChange, setValues } = useForm({
    title: '',
    speaker: '',
    description: '',
    scripture: '',
    category: 'sunday-service',
    date: '',
    duration: '00:00',
    videoUrl: '',
    audioUrl: '',
    imageUrl: '',
    isLive: false,
    liveStreamUrl: '',
    tags: [],
    series: '',
    seriesPart: '',
    ...sermonData
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  const addTag = () => {
    setValues({
      ...values,
      tags: [...values.tags, '']
    });
  };

  const removeTag = (index) => {
    const updatedTags = [...values.tags];
    updatedTags.splice(index, 1);
    setValues({ ...values, tags: updatedTags });
  };

  const updateTag = (index, value) => {
    const updatedTags = [...values.tags];
    updatedTags[index] = value;
    setValues({ ...values, tags: updatedTags });
  };

  useEffect(() => {
    if (isOpen) {
      document.querySelector('.form-input')?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter users who can be speakers (staff, moderators, admins, volunteers)
  const potentialSpeakers = users.filter(user =>
    ['admin', 'moderator', 'staff', 'volunteer'].includes(user.role) && user.status === 'active'
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sermonData._id ? 'Edit Sermon' : 'Create Sermon'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sermon Title*</label>
            <input
              type="text"
              name="title"
              value={values.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Speaker*</label>
            <select
              name="speaker"
              value={values.speaker}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a speaker</option>
              {potentialSpeakers.map(user => (
                <option key={user._id} value={user._id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date*</label>
            <input
              type="date"
              name="date"
              value={values.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration</label>
            <input
              type="text"
              name="duration"
              value={values.duration}
              onChange={handleChange}
              className="form-input"
              placeholder="00:00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category*</label>
            <select
              name="category"
              value={values.category}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="sunday-service">Sunday Service</option>
              <option value="bible-study">Bible Study</option>
              <option value="prayer-meeting">Prayer Meeting</option>
              <option value="youth">Youth Service</option>
              <option value="special">Special Event</option>
              <option value="faith">Faith</option>
              <option value="hope">Hope</option>
              <option value="love">Love</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Scripture Reference</label>
            <input
              type="text"
              name="scripture"
              value={values.scripture}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., John 3:16"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description*</label>
          <textarea
            name="description"
            value={values.description}
            onChange={handleChange}
            className="form-input"
            rows="3"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Series</label>
            <input
              type="text"
              name="series"
              value={values.series}
              onChange={handleChange}
              className="form-input"
              placeholder="Series name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Series Part</label>
            <input
              type="number"
              name="seriesPart"
              value={values.seriesPart}
              onChange={handleChange}
              className="form-input"
              min="1"
              placeholder="Part number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="url"
            name="imageUrl"
            value={values.imageUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Media Options</h3>

          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              name="isLive"
              checked={values.isLive}
              onChange={handleChange}
              className="form-checkbox h-4 w-4 text-[#FF7E45]"
              id="isLiveCheckbox"
            />
            <label htmlFor="isLiveCheckbox" className="ml-2 text-sm font-medium">
              This is a live stream
            </label>
          </div>

          {values.isLive ? (
            <div>
              <label className="block text-sm font-medium mb-1">Live Stream URL*</label>
              <input
                type="url"
                name="liveStreamUrl"
                value={values.liveStreamUrl}
                onChange={handleChange}
                className="form-input"
                placeholder="https://youtube.com/live/..."
                required={values.isLive}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the live stream URL (YouTube, Facebook, Vimeo, etc.)
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Video URL</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={values.videoUrl}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Audio URL</label>
                <input
                  type="url"
                  name="audioUrl"
                  value={values.audioUrl}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="https://audiofile.com/..."
                />
              </div>
            </>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Tags</label>
            <button
              type="button"
              onClick={addTag}
              className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
            >
              + Add Tag
            </button>
          </div>
          {values.tags.map((tag, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                placeholder="Tag"
                value={tag}
                onChange={(e) => updateTag(index, e.target.value)}
                className="form-input flex-1"
              />
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {sermonData._id ? 'Update' : 'Create'} Sermon
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Live Stream Control Component
const LiveStreamControl = ({ isLive, onStartLive, onStopLive, liveStats }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Live Stream Control</h3>

      {isLive ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="font-medium text-red-600">Live Stream Active</span>
          </div>

          {liveStats && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Viewers:</span>
                <span className="font-medium ml-2">{liveStats.viewers || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium ml-2">{liveStats.duration || '0:00'}</span>
              </div>
            </div>
          )}

          <button
            onClick={onStopLive}
            className="btn btn-danger"
          >
            <i className="fas fa-stop mr-2"></i> End Live Stream
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <i className="fas fa-info-circle mr-1"></i>
              Your live stream is currently active and visible to members and guests.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="font-medium text-gray-600">No Active Live Stream</span>
          </div>

          <button
            onClick={onStartLive}
            className="btn btn-primary"
          >
            <i className="fas fa-broadcast-tower mr-2"></i> Start Live Stream
          </button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              Make sure your streaming software is configured before starting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Form Component
const SettingsForm = ({ settings, onUpdateSettings }) => {
  const { values, handleChange, setValues } = useForm({
    churchName: settings.churchName || '',
    churchAddress: settings.churchAddress || {},
    contactEmail: settings.contactEmail || '',
    contactPhone: settings.contactPhone || '',
    pastorName: settings.pastorName || '',
    serviceTimes: settings.serviceTimes || [],
    socialMedia: settings.socialMedia || {},
    liveStreamUrl: settings.liveStreamUrl || '',
    givingOptions: settings.givingOptions || {},
    emailSettings: settings.emailSettings || {},
    sermonSettings: settings.sermonSettings || {},
    eventSettings: settings.eventSettings || {},
    prayerRequestSettings: settings.prayerRequestSettings || {},
    testimonialSettings: settings.testimonialSettings || {},
    blogSettings: settings.blogSettings || {},
    ministrySettings: settings.ministrySettings || {},
    ...settings
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateSettings(values);
  };

  const addServiceTime = () => {
    setValues({
      ...values,
      serviceTimes: [...values.serviceTimes, { day: '', time: '', description: '' }]
    });
  };

  const removeServiceTime = (index) => {
    const updatedServiceTimes = [...values.serviceTimes];
    updatedServiceTimes.splice(index, 1);
    setValues({ ...values, serviceTimes: updatedServiceTimes });
  };

  const updateServiceTime = (index, field, value) => {
    const updatedServiceTimes = [...values.serviceTimes];
    updatedServiceTimes[index][field] = value;
    setValues({ ...values, serviceTimes: updatedServiceTimes });
  };

  const updateAddress = (field, value) => {
    setValues({
      ...values,
      churchAddress: {
        ...values.churchAddress,
        [field]: value
      }
    });
  };

  const updateSocialMedia = (platform, value) => {
    setValues({
      ...values,
      socialMedia: {
        ...values.socialMedia,
        [platform]: value
      }
    });
  };

  const updateGivingOptions = (field, value) => {
    setValues({
      ...values,
      givingOptions: {
        ...values.givingOptions,
        [field]: value
      }
    });
  };

  const updateEmailSettings = (field, value) => {
    setValues({
      ...values,
      emailSettings: {
        ...values.emailSettings,
        [field]: value
      }
    });
  };

  const updateSermonSettings = (field, value) => {
    setValues({
      ...values,
      sermonSettings: {
        ...values.sermonSettings,
        [field]: value
      }
    });
  };

  const updateEventSettings = (field, value) => {
    setValues({
      ...values,
      eventSettings: {
        ...values.eventSettings,
        [field]: value
      }
    });
  };

  const updatePrayerRequestSettings = (field, value) => {
    setValues({
      ...values,
      prayerRequestSettings: {
        ...values.prayerRequestSettings,
        [field]: value
      }
    });
  };

  const updateTestimonialSettings = (field, value) => {
    setValues({
      ...values,
      testimonialSettings: {
        ...values.testimonialSettings,
        [field]: value
      }
    });
  };

  const updateBlogSettings = (field, value) => {
    setValues({
      ...values,
      blogSettings: {
        ...values.blogSettings,
        [field]: value
      }
    });
  };

  const updateMinistrySettings = (field, value) => {
    setValues({
      ...values,
      ministrySettings: {
        ...values.ministrySettings,
        [field]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center ">
          <div className=" text-center justify-between md:text-left">
            <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
            <p className="text-gray-600 mt-2">Manage your church website configuration and preferences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-h-[75vh] overflow-y-auto">
        <form id="settings-form" onSubmit={handleSubmit} className="space-y-8">

          {/* Church Information Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center">
              <i className="fas fa-church text-[#FF7E45] mr-3"></i>
              Church Information
            </h3>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Church Name*</label>
                  <input
                    type="text"
                    name="churchName"
                    value={values.churchName}
                    onChange={handleChange}
                    className="w-full form-input-lg border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    required
                    placeholder="Enter church name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pastor Name</label>
                  <input
                    type="text"
                    name="pastorName"
                    value={values.pastorName}
                    onChange={handleChange}
                    className="w-full form-input-lg border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    placeholder="Enter pastor's name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={values.contactEmail}
                      onChange={handleChange}
                      className="w-full form-input-lg border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                      placeholder="contact@church.org"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={values.contactPhone}
                      onChange={handleChange}
                      className="w-full form-input-lg border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Church Address</label>
                <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={values.churchAddress.street || ''}
                    onChange={(e) => updateAddress('street', e.target.value)}
                    className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={values.churchAddress.city || ''}
                      onChange={(e) => updateAddress('city', e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={values.churchAddress.state || ''}
                      onChange={(e) => updateAddress('state', e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={values.churchAddress.zipCode || ''}
                    onChange={(e) => updateAddress('zipCode', e.target.value)}
                    className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Times Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <i className="far fa-clock text-[#FF7E45] mr-3"></i>
                Service Times
              </h3>
              <button
                type="button"
                onClick={addServiceTime}
                className="btn btn-primary bg-[#FF7E45] hover:bg-[#F4B942] text-white px-4 py-2 rounded-lg font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Service Time
              </button>
            </div>

            <div className="space-y-4">
              {values.serviceTimes.map((service, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-white p-4 rounded-lg border border-gray-200">
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Day (e.g., Sunday)"
                      value={service.day}
                      onChange={(e) => updateServiceTime(index, 'day', e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      placeholder="Time (e.g., 10:00 AM)"
                      value={service.time}
                      onChange={(e) => updateServiceTime(index, 'time', e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Description"
                      value={service.description}
                      onChange={(e) => updateServiceTime(index, 'description', e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeServiceTime(index)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Remove service time"
                    >
                      <i className="fas fa-times text-lg"></i>
                    </button>
                  </div>
                </div>
              ))}
              {values.serviceTimes.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <i className="far fa-clock text-3xl mb-2"></i>
                  <p>No service times added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Social Media Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center">
              <i className="fas fa-share-alt text-[#FF7E45] mr-3"></i>
              Social Media
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                { platform: 'facebook', icon: 'fab fa-facebook', color: 'text-blue-600', label: 'Facebook URL' },
                { platform: 'instagram', icon: 'fab fa-instagram', color: 'text-pink-600', label: 'Instagram URL' },
                { platform: 'twitter', icon: 'fab fa-twitter', color: 'text-blue-400', label: 'Twitter URL' },
                { platform: 'youtube', icon: 'fab fa-youtube', color: 'text-red-600', label: 'YouTube URL' }
              ].map((social) => (
                <div key={social.platform} className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${social.color} bg-gray-50`}>
                    <i className={`${social.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder={social.label}
                      value={values.socialMedia[social.platform] || ''}
                      onChange={(e) => updateSocialMedia(social.platform, e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Stream Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center">
              <i className="fas fa-broadcast-tower text-[#FF7E45] mr-3"></i>
              Live Stream
            </h3>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Live Stream URL</label>
              <input
                type="url"
                name="liveStreamUrl"
                value={values.liveStreamUrl}
                onChange={handleChange}
                className="w-full form-input-lg border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                placeholder="https://youtube.com/live/..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the URL for your live stream service (YouTube, Facebook, etc.)
              </p>
            </div>
          </div>

          {/* Giving Options Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center">
              <i className="fas fa-donate text-[#FF7E45] mr-3"></i>
              Giving Options
            </h3>

            <div className="space-y-6">
              <div className="flex items-center bg-white p-4 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  name="enableOnlineGiving"
                  checked={values.givingOptions.enableOnlineGiving || false}
                  onChange={(e) => updateGivingOptions('enableOnlineGiving', e.target.checked)}
                  className="form-checkbox h-5 w-5 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                  id="enableOnlineGiving"
                />
                <label htmlFor="enableOnlineGiving" className="ml-3 text-sm font-medium text-gray-700">
                  Enable Online Giving
                </label>
              </div>

              {values.givingOptions.enableOnlineGiving && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stripe Publishable Key</label>
                    <input
                      type="text"
                      value={values.givingOptions.stripePublishableKey || ''}
                      onChange={(e) => updateGivingOptions('stripePublishableKey', e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stripe Secret Key</label>
                    <input
                      type="password"
                      value={values.givingOptions.stripeSecretKey || ''}
                      onChange={(e) => updateGivingOptions('stripeSecretKey', e.target.value)}
                      className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                      placeholder="sk_test_..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Settings Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center">
              <i className="fas fa-envelope text-[#FF7E45] mr-3"></i>
              Email Settings
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={values.emailSettings.host || ''}
                    onChange={(e) => updateEmailSettings('host', e.target.value)}
                    className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={values.emailSettings.port || ''}
                    onChange={(e) => updateEmailSettings('port', parseInt(e.target.value) || '')}
                    className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Username</label>
                  <input
                    type="text"
                    value={values.emailSettings.auth?.user || ''}
                    onChange={(e) => updateEmailSettings('auth', { ...values.emailSettings.auth, user: e.target.value })}
                    className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Password</label>
                  <input
                    type="password"
                    value={values.emailSettings.auth?.pass || ''}
                    onChange={(e) => updateEmailSettings('auth', { ...values.emailSettings.auth, pass: e.target.value })}
                    className="w-full form-input border-2 border-gray-300 rounded-lg px-4 py-2.5 focus:border-[#FF7E45] focus:ring-2 focus:ring-[#FF7E45]/20 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center mt-6 bg-white p-4 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                checked={values.emailSettings.secure || false}
                onChange={(e) => updateEmailSettings('secure', e.target.checked)}
                className="form-checkbox h-5 w-5 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                id="secureSMTP"
              />
              <label htmlFor="secureSMTP" className="ml-3 text-sm font-medium text-gray-700">
                Use SSL/TLS for secure connection
              </label>
            </div>
          </div>

          {/* Module Settings Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center">
              <i className="fas fa-cubes text-[#FF7E45] mr-3"></i>
              Module Settings
            </h3>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

              {/* Sermon Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-microphone-alt text-[#FF7E45] mr-2"></i>
                  Sermon Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.sermonSettings.autoPublish || false}
                      onChange={(e) => updateSermonSettings('autoPublish', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="autoPublishSermons"
                    />
                    <label htmlFor="autoPublishSermons" className="ml-2 text-sm font-medium text-gray-700">
                      Auto-publish new sermons
                    </label>
                  </div>
                </div>
              </div>

              {/* Blog Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <i className="far fa-newspaper text-[#FF7E45] mr-2"></i>
                  Blog Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.blogSettings.enableComments || false}
                      onChange={(e) => updateBlogSettings('enableComments', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="enableBlogComments"
                    />
                    <label htmlFor="enableBlogComments" className="ml-2 text-sm font-medium text-gray-700">
                      Enable blog comments
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.blogSettings.requireApproval || false}
                      onChange={(e) => updateBlogSettings('requireApproval', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="requireBlogApproval"
                    />
                    <label htmlFor="requireBlogApproval" className="ml-2 text-sm font-medium text-gray-700">
                      Require blog post approval
                    </label>
                  </div>
                </div>
              </div>

              {/* Ministry Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-hands-helping text-[#FF7E45] mr-2"></i>
                  Ministry Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.ministrySettings.enableVolunteerSignup || false}
                      onChange={(e) => updateMinistrySettings('enableVolunteerSignup', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="enableVolunteerSignup"
                    />
                    <label htmlFor="enableVolunteerSignup" className="ml-2 text-sm font-medium text-gray-700">
                      Enable volunteer signup
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.ministrySettings.showLeaders !== false}
                      onChange={(e) => updateMinistrySettings('showLeaders', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="showMinistryLeaders"
                    />
                    <label htmlFor="showMinistryLeaders" className="ml-2 text-sm font-medium text-gray-700">
                      Show ministry leaders publicly
                    </label>
                  </div>
                </div>
              </div>

              {/* Event Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <i className="far fa-calendar-alt text-[#FF7E45] mr-2"></i>
                  Event Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.eventSettings.requireApproval || false}
                      onChange={(e) => updateEventSettings('requireApproval', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="requireEventApproval"
                    />
                    <label htmlFor="requireEventApproval" className="ml-2 text-sm font-medium text-gray-700">
                      Require event approval
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.eventSettings.allowPublicRSVP !== false}
                      onChange={(e) => updateEventSettings('allowPublicRSVP', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="allowPublicRSVP"
                    />
                    <label htmlFor="allowPublicRSVP" className="ml-2 text-sm font-medium text-gray-700">
                      Allow public RSVP
                    </label>
                  </div>
                </div>
              </div>

              {/* Prayer Request Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-praying-hands text-[#FF7E45] mr-2"></i>
                  Prayer Request Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.prayerRequestSettings.requireApproval !== false}
                      onChange={(e) => updatePrayerRequestSettings('requireApproval', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="requirePrayerApproval"
                    />
                    <label htmlFor="requirePrayerApproval" className="ml-2 text-sm font-medium text-gray-700">
                      Require prayer request approval
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.prayerRequestSettings.allowAnonymous !== false}
                      onChange={(e) => updatePrayerRequestSettings('allowAnonymous', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="allowAnonymousPrayer"
                    />
                    <label htmlFor="allowAnonymousPrayer" className="ml-2 text-sm font-medium text-gray-700">
                      Allow anonymous prayer requests
                    </label>
                  </div>
                </div>
              </div>

              {/* Testimonial Settings */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
                  <i className="far fa-comment-dots text-[#FF7E45] mr-2"></i>
                  Testimonial Settings
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.testimonialSettings.requireApproval !== false}
                      onChange={(e) => updateTestimonialSettings('requireApproval', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="requireTestimonialApproval"
                    />
                    <label htmlFor="requireTestimonialApproval" className="ml-2 text-sm font-medium text-gray-700">
                      Require testimonial approval
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={values.testimonialSettings.allowVideo !== false}
                      onChange={(e) => updateTestimonialSettings('allowVideo', e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#FF7E45] rounded focus:ring-[#FF7E45]"
                      id="allowVideoTestimonials"
                    />
                    <label htmlFor="allowVideoTestimonials" className="ml-2 text-sm font-medium text-gray-700">
                      Allow video testimonials
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setValues(settings)}
              className="btn btn-outline px-8 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg"
            >
              <i className="fas fa-undo mr-2"></i>
              Reset Changes
            </button>
            <button
              type="submit"
              className="btn btn-primary px-10 py-3 bg-[#FF7E45] hover:bg-[#F4B942] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <i className="fas fa-save mr-2"></i>
              Save All Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main AdminPage Component
const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSermonModalOpen, setIsSermonModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSermon, setSelectedSermon] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [deleteItem, setDeleteItem] = useState(null);
  const [liveStreamStatus, setLiveStreamStatus] = useState(false);
  const [liveStats, setLiveStats] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const alert = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "SMC: - Admin | St. Micheal`s & All Angels Church | Ifite-Awka";

    if (user && (user.role === 'admin')) {
      fetchDashboardData();
      fetchSettings();
      checkLiveStreamStatus();
    }
  }, [user]);

  // Fixed data fetching to match server response structure
  const fetchDashboardData = async () => {
    if (!user || !user.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const requests = [
        utilityService.getDashboardStats(),
        utilityService.getRecentActivity(),
        userService.getAllUsers({ limit: 100 }),
        ministryService.getAll({ limit: 100 }),
        testimonialService.getAll({ limit: 100 }),
        blogService.getAll({ limit: 100 }),
        eventService.getAll({ limit: 100 }),
        sermonService.getAll({ limit: 100 }),
        donationService.getAll({ limit: 100 }),
        prayerService.getAll({ limit: 100 }),
        adminService.getSettings()
      ];

      const responses = await Promise.allSettled(requests);

      // Process each response with proper array safety
      responses.forEach((response, index) => {
        if (response.status === "fulfilled") {
          const result = response.value;

          // Extract data from different possible response structures
          let data = result?.data || result;

          switch (index) {
            case 0: // Stats
              setStats(typeof data === 'object' ? data : {});
              break;

            case 1: // Recent Activity
              const activities = data?.activities || data;
              setRecentActivity(Array.isArray(activities) ? activities : []);
              break;

            case 2: // Users
              const users = data?.users || data;
              setUsers(Array.isArray(users) ? users : []);
              break;

            case 3: // Ministries
              const ministries = data?.ministries || data;
              setMinistries(Array.isArray(ministries) ? ministries : []);
              break;

            case 4: // Testimonials
              const testimonials = data?.testimonials || data;
              setTestimonials(Array.isArray(testimonials) ? testimonials : []);
              break;

            case 5: // Blog Posts
              const blogPosts = data?.posts || data;
              setBlogPosts(Array.isArray(blogPosts) ? blogPosts : []);
              break;

            case 6: // Events
              const events = data?.events || data;
              setUpcomingEvents(Array.isArray(events) ? events : []);
              break;

            case 7: // Sermons - FIXED: Ensure this is always an array
              const sermons = data?.sermons || data;
              setSermons(Array.isArray(sermons) ? sermons : []);
              break;

            case 8: // Donations
              const donations = data?.donations || data;
              setDonations(Array.isArray(donations) ? donations : []);
              break;

            case 9: // Prayer Requests
              const prayers = data?.prayers || data;
              setPrayerRequests(Array.isArray(prayers) ? prayers : []);
              break;

            case 10: // Settings
              const settings = data?.settings || data;
              setSettings(typeof settings === 'object' ? settings : {});
              break;
          }
        } else {
          console.warn(`Request ${index} failed:`, response.reason);
          // Set empty defaults for failed requests
          switch (index) {
            case 0: setStats({}); break;
            case 1: setRecentActivity([]); break;
            case 2: setUsers([]); break;
            case 3: setMinistries([]); break;
            case 4: setTestimonials([]); break;
            case 5: setBlogPosts([]); break;
            case 6: setUpcomingEvents([]); break;
            case 7: setSermons([]); break;
            case 8: setDonations([]); break;
            case 9: setPrayerRequests([]); break;
            case 10: setSettings({}); break;
          }
        }
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load dashboard data";
      setError(errorMessage);
      alert.error(errorMessage);

      // Set empty defaults on error
      setSermons([]);
      setUpcomingEvents([]);
      setUsers([]);
      setMinistries([]);
      setTestimonials([]);
      setBlogPosts([]);
      setDonations([]);
      setPrayerRequests([]);
      setRecentActivity([]);
      setStats({});
      setSettings({});
    } finally {
      setIsLoading(false);
    }
  };
  // Settings Handlers
  const fetchSettings = async () => {
    try {
      const response = await adminService.getSettings();
      setSettings(response.settings || response);
    } catch (error) {
      console.error('Error fetching settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load settings';
      alert.error(errorMessage);
    }
  };

  const handleUpdateSettings = async (settingsData) => {
    try {
      const response = await adminService.updateSettings(settingsData);
      const updatedSettings = response.data?.settings || response.settings;

      if (updatedSettings) {
        setSettings(updatedSettings);
        return { success: true, message: 'Settings updated successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update settings';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleResetSettings = async () => {
    try {
      const response = await adminService.resetSettings();
      setSettings(response.settings || response);
      alert.success('Settings reset successfully');
      return { success: true, message: 'Settings reset successfully' };
    } catch (error) {
      console.error('Error resetting settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset settings';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Live Stream Handlers
  const checkLiveStreamStatus = async () => {
    try {
      const response = await sermonService.getLiveStatus();
      setLiveStreamStatus(response.isLive || false);
      setLiveStats(response.status || null);
    } catch (error) {
      console.error('Error getting live stream status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to get live stream status';
      alert.error(errorMessage);

      return { success: false, message: errorMessage };
    }
  };

  const handleStartLiveStream = async () => {
    try {
      const response = await sermonService.startLiveStream();
      setLiveStreamStatus(true);
      alert.success('Live stream started successfully');
      return { success: true, message: 'Live stream started successfully' };
    } catch (error) {
      console.error('Error starting live stream:', error);
      const errorMessage = error.response?.data?.message || 'Failed to start live stream';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleStopLiveStream = async () => {
    try {
      const response = await sermonService.stopLiveStream();
      setLiveStreamStatus(false);
      setLiveStats(null);
      alert.success('Live stream ended successfully');
      return { success: true, message: 'Live stream ended successfully' };
    } catch (error) {
      console.error('Error stopping live stream:', error);
      const errorMessage = error.response?.data?.message || 'Failed to stop live stream';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // User Management Handlers
  const handleCreateUser = async (userData) => {
    try {
      const response = await userService.createUser(userData);
      const newUser = response.data?.user || response.user || response.data || response;

      if (newUser && newUser._id) {
        setUsers((prev) => [...prev, newUser]);
        alert.success("User created successfully");
        return { success: true };
      } else throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Error creating user:", error);
      alert.error(error.response?.data?.message || "Failed to create user");
      return { success: false };
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      const response = await userService.updateUser(userId, userData);
      const updatedUser = response.data?.user || response.user || response.data || response;

      if (updatedUser && updatedUser._id) {
        setUsers(prev => [...prev, updatedUser]);
        return { success: true, message: 'User updated successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(user => user._id !== userId));
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Ministry Management Handlers
  const handleCreateMinistry = async (ministryData) => {
    try {
      const response = await ministryService.create(ministryData);
      const newMinistry = response.data?.ministry || response.data?.data || response.data || response;

      if (!newMinistry || !newMinistry._id) {
        throw new Error("Invalid response from server");
      }
      if (newMinistry) {
        setMinistries((prev) => [...prev, newMinistry]);
        setStats((prev) => ({
          ...prev,
          totalMinistries: (prev.totalMinistries || 0) + 1,
          activeMinistries: (prev.activeMinistries || 0) + (newMinistry.status === "active" ? 1 : 0),
        }));

        return {
          success: true, message: "✅ Ministry created successfully!", data: newMinistry,
        };
      }
    } catch (error) {
      console.error("❌ Error creating ministry:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to create ministry";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateMinistry = async (ministryId, ministryData) => {
    try {
      const response = await ministryService.update(ministryId, ministryData);
      const updatedMinistry = response.data?.ministry || response.data?.data || response.data || response;

      if (!updatedMinistry || !updatedMinistry._id) {
        throw new Error("Invalid response from server");
      }

      // ✅ Instantly reflect changes in UI table
      setMinistries((prev) => prev.map((ministry) => ministry._id === ministryId ? updatedMinistry : ministry));

      alert.success("✅ Ministry updated successfully!");
      return { success: true, message: "Ministry updated successfully", data: updatedMinistry };
    } catch (error) {
      console.error("❌ Error updating ministry:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update ministry";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteMinistry = async (ministryId) => {
    try {
      const response = await ministryService.delete(ministryId);
      const success = response?.data?.success !== false && response?.status !== 400;

      if (success) {
        // ✅ Instantly remove deleted ministry from table
        setMinistries((prev) =>
          prev.filter((ministry) => ministry._id !== ministryId)
        );

        // ✅ Optional: update dashboard stats instantly
        setStats((prev) => ({
          ...prev,
          totalMinistries: Math.max((prev.totalMinistries || 1) - 1, 0),
        }));

        alert.success("🗑️ Ministry deleted successfully!");
        return { success: true, message: "Ministry deleted successfully" };
      } else {
        throw new Error("Failed to delete ministry");
      }
    } catch (error) {
      console.error("❌ Error deleting ministry:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete ministry";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };


  // Testimonial Management Handlers
  const handleCreateTestimonial = async (testimonialData) => {
    try {
      const response = await testimonialService.createTestimonial(testimonialData);
      setTestimonials(prev => [...prev, response.data?.testimonial || response.testimonial]);
      return { success: true, message: 'Testimonial created successfully' };
    } catch (error) {
      console.error('Error creating testimonial:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create testimonial';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateTestimonial = async (testimonialId, testimonialData) => {
    try {
      const response = await testimonialService.updateTestimonial(testimonialId, testimonialData);
      setTestimonials(prev => prev.map(testimonial => testimonial._id === testimonialId ? response.data?.testimonial || response.testimonial : testimonial));
      return { success: true, message: 'Testimonial updated successfully' };
    } catch (error) {
      console.error('Error updating testimonial:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update testimonial';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteTestimonial = async (testimonialId) => {
    try {
      await testimonialService.deleteTestimonial(testimonialId);
      setTestimonials(prev => prev.filter(testimonial => testimonial._id !== testimonialId));
      return { success: true, message: 'Testimonial deleted successfully' };
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete testimonial';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Blog Management Handlers
  const handleCreateBlogPost = async (blogData) => {
    try {
      const response = await blogService.create(blogData);
      setBlogPosts(prev => [...prev, response.data?.data || response.data || response]);
      alert.success('Blog post created successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error creating blog post:', error);
      alert.error(error.response?.data?.message || 'Failed to create blog post');
      return { success: false };
    }
  };

  const handleUpdateBlogPost = async (blogId, blogData) => {
    try {
      const response = await blogService.update(blogId, blogData);
      setBlogPosts(prev =>
        prev.map(post =>
          post._id === blogId ? (response.data?.data || response.data || response) : post
        )
      );
      alert.success('Blog post updated successfully!');
      return { success: true };
    } catch (error) {
      alert.error(error.response?.data?.message || 'Failed to update blog post');
      return { success: false };
    }
  };

  const handleDeleteBlogPost = async (blogId) => {
    try {
      await blogService.delete(blogId);
      setBlogPosts(prev => prev.filter(post => post._id !== blogId));
      alert.success('Blog post deleted successfully!');
      return { success: true };
    } catch (error) {
      alert.error(error.response?.data?.message || 'Failed to delete blog post');
      return { success: false };
    }
  };

  // Event Management Handlers
  const handleCreateEvent = async (eventData) => {
    try {
      const response = await eventService.create(eventData);
      const newEvent = response.data?.event || response.event;

      if (newEvent) {
        setUpcomingEvents(prev => [...prev, newEvent]);
        return { success: true, message: 'Event created successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create event';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      const response = await eventService.update(eventId, eventData);;
      const updatedEvent = response.data?.event || response.event;

      if (updatedEvent) {
        setUpcomingEvents(prev => prev.map(event => event._id === eventId ? updatedEvent : event));
        return { success: true, message: 'Event updated successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await eventService.delete(eventId);
      setUpcomingEvents(prev => prev.filter(event => event._id !== eventId));
      return { success: true, message: 'Event deleted successfully' };
    } catch (error) {
      console.error('Error deleting event:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete event';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Sermon Management Handlers
  const handleCreateSermon = async (sermonData) => {
    try {
      const response = await sermonService.create(sermonData);
      const newSermon = response.data?.sermon || response.sermon;

      if (newSermon) {
        setSermons(prev => [...prev, newSermon]);
        return { success: true, message: 'Sermon created successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating sermon:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create sermon';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateSermon = async (sermonId, sermonData) => {
    try {
      const response = await sermonService.update(sermonId, sermonData);
      const updatedSermon = response.data?.sermon || response.sermon;

      if (updatedSermon) {
        setSermons(prev => prev.map(sermon => sermon._id === sermonId ? updatedSermon : sermon));
        return { success: true, message: 'Sermon updated successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating sermon:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update sermon';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteSermon = async (sermonId) => {
    try {
      await sermonService.delete(sermonId);
      setSermons(prev => prev.filter(sermon => sermon._id !== sermonId));
      return { success: true, message: 'Sermon deleted successfully' };
    } catch (error) {
      console.error('Error deleting sermon:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete sermon';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Donation Management Handlers
  const handleUpdateDonation = async (donationId, donationData) => {
    try {
      const response = await donationService.updateDonation(donationId, donationData);
      const updatedDonation = response.data?.donation || response.donation;

      if (updatedDonation) {
        setDonations(prev => prev.map(donation => donation._id === donationId ? updatedDonation : donation));
        return { success: true, message: 'Donation updated successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating donations:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update donations';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Prayer Request Management Handlers
  const handleUpdatePrayerRequest = async (prayerId, prayerData) => {
    try {
      const response = await prayerService.updatePrayerRequest(prayerId, prayerData);
      const updatedPrayer = response.data?.prayer || response.prayer;

      if (updatedPrayer) {
        setPrayerRequests(prev => prev.map(prayer => prayer._id === prayerId ? updatedPrayer : prayer));
        return { success: true, message: 'Prayer request updated successfully' };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating prayer request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update prayer request';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeletePrayerRequest = async (prayerId) => {
    try {
      await prayerService.deletePrayerRequest(prayerId);
      setPrayerRequests(prev => prev.filter(prayer => prayer._id !== prayerId));
      return { success: true, message: 'Prayer request deleted successfully' };
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete prayer request';
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  /* =============== Modal Handlers ================== */

  // Event Modal
  const openEventModal = (event = null) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setIsEventModalOpen(false);
  };

  // Sermon Modal
  const openSermonModal = (sermon = null) => {
    setSelectedSermon(sermon);
    setIsSermonModalOpen(true);
  };

  const closeSermonModal = () => {
    setSelectedSermon(null);
    setIsSermonModalOpen(false);
  };

  // Setting Modal
  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  // Delete Modal
  const openDeleteModal = (item, type) => {
    setDeleteItem(item);
    setDeleteType(type);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteItem(null);
    setDeleteType('');
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      let result;
      switch (deleteType) {
        case 'user':
          result = await handleDeleteUser(deleteItem._id);
          break;
        case 'ministry':
          result = await handleDeleteMinistry(deleteItem._id);
          break;
        case 'testimonial':
          result = await handleDeleteTestimonial(deleteItem._id);
          break;
        case 'blog':
          result = await handleDeleteBlogPost(deleteItem._id);
          break;
        case 'event':
          result = await handleDeleteEvent(deleteItem._id);
          break;
        case 'sermon':
          result = await handleDeleteSermon(deleteItem._id);
          break;
        case 'prayer':
          result = await handleDeletePrayerRequest(deleteItem._id);
          break;
        default:
          result = { success: false, message: 'Unknown item type' };
      }

      if (result.success) {
        alert.success(result.message);
      } else {
        alert.error(result.message);
      }
    } catch (error) {
      alert.error('An error occurred during deletion');
    } finally {
      closeDeleteModal();
    }
  };

  const handleEventSubmit = async (eventData) => {
    try {
      let result;
      if (selectedEvent) {
        result = await handleUpdateEvent(selectedEvent._id, eventData);
      } else {
        result = await handleCreateEvent(eventData);
      }

      if (result.success) {
        alert.success(result.message);
        closeEventModal();
      } else {
        alert.error(result.message);
      }
    } catch (error) {
      alert.error('An error occurred while saving the event');
    }
  };

  const handleSermonSubmit = async (sermonData) => {
    try {
      let result;
      if (selectedSermon) {
        result = await handleUpdateSermon(selectedSermon._id, sermonData);
      } else {
        result = await handleCreateSermon(sermonData);
      }

      if (result.success) {
        alert.success(result.message);
        closeSermonModal();
      } else {
        alert.error(result.message);
      }
    } catch (error) {
      alert.error('An error occurred while saving the sermon');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the admin panel.</p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return <Loader type="spinner" text="Checking admin access..." fullScreen />;
  }

  if (isLoading) {
    return <Loader type="spinner" text="Loading admin dashboard..." fullScreen />;
  }


  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Admin privileges are required to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-3"></i>
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', icon: 'fas fa-tachometer-alt', tabName: 'overview' },
    { label: 'Users', icon: 'fas fa-users', tabName: 'users' },
    { label: 'Ministries', icon: 'fas fa-hands-helping', tabName: 'ministries' },
    { label: 'Testimonials', icon: 'far fa-comment-dots', tabName: 'testimonials' },
    { label: 'Blog', icon: 'far fa-newspaper', tabName: 'blog' },
    { label: 'Events', icon: 'far fa-calendar-alt', tabName: 'events' },
    { label: 'Sermons', icon: 'fas fa-microphone-alt', tabName: 'sermons' },
    { label: 'Donations', icon: 'fas fa-hand-holding-usd', tabName: 'donations' },
    { label: 'Prayer Requests', icon: 'fas fa-praying-hands', tabName: 'prayer' },
    { label: 'Live Stream', icon: 'fas fa-broadcast-tower', tabName: 'live' },
    { label: 'Settings', icon: 'fas fa-cog', tabName: 'settings' },
  ];

  const eventColumns = [
    { key: 'title', title: 'Event' },
    { key: 'date', title: 'Date', render: (event) => formatDate(event.startTime) },
    { key: 'time', title: 'Time', render: (event) => formatTime(event.startTime) },
    { key: 'location', title: 'Location' },
    { key: 'rsvps', title: 'RSVPs', render: (event) => event.rsvpCount || 0 },
    {
      key: 'status',
      title: 'Status',
      render: (event) => (
        <span className={`text-xs px-2 py-1 rounded ${event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {event.status || 'Unknown'}
        </span>
      )
    }
  ];

  const sermonColumns = [
    { key: 'title', title: 'Title' },
    { key: 'speaker', title: 'Speaker', render: (sermon) => sermon.speakerName || sermon.speaker },
    { key: 'date', title: 'Date', render: (sermon) => formatDate(sermon.date) },
    { key: 'scripture', title: 'Scripture' },
    {
      key: 'type',
      title: 'Type',
      render: (sermon) => (
        <span className={`text-xs px-2 py-1 rounded ${sermon.isLive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
          {sermon.isLive ? 'Live' : 'Recorded'}
        </span>
      )
    }
  ];

  return (
    <div className="page">
      <section className="bg-gradient-to-r from-[#333] to-[#555] py-8 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/5 mb-6 lg:mb-0">
              <div className="bg-white rounded-lg shadow-md p-4">
                <nav>
                  <ul className="space-y-1">
                    {navItems.map(item => (
                      <SidebarButton
                        key={item.tabName}
                        label={item.label}
                        icon={item.icon}
                        tabName={item.tabName}
                        activeTab={activeTab}
                        onClick={setActiveTab}
                      />
                    ))}
                  </ul>
                </nav>
              </div>
            </div>

            <div className="lg:w-4/5 lg:pl-8">
              {activeTab === 'overview' && (
                <TabContentWrapper activeTab={activeTab} tabName="overview">
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
                      <p className="text-gray-600 mb-4">Welcome to the admin dashboard. Here's a summary of your church's activity.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <StatCard
                        title="Total Members"
                        value={stats.totalMembers || '0'}
                        change={stats.membersChange || '0% from last month'}
                        changeType={stats.membersChangeType || 'increase'}
                        icon="fa-users"
                        iconBgColor="bg-blue-100"
                        iconTextColor="text-blue-500"
                      />
                      <StatCard
                        title="Weekly Attendance"
                        value={stats.weeklyAttendance || '0'}
                        change={stats.attendanceChange || '0% from last week'}
                        changeType={stats.attendanceChangeType || 'increase'}
                        icon="fa-user-check"
                        iconBgColor="bg-green-100"
                        iconTextColor="text-green-500"
                      />
                      <StatCard
                        title="Online Viewers"
                        value={stats.onlineViewers || '0'}
                        change={stats.viewersChange || '0% from last week'}
                        changeType={stats.viewersChangeType || 'increase'}
                        icon="fa-video"
                        iconBgColor="bg-purple-100"
                        iconTextColor="text-purple-500"
                      />
                      <StatCard
                        title="Weekly Giving"
                        value={stats.weeklyGiving ? `$${stats.weeklyGiving.toLocaleString()}` : '$0'}
                        change={stats.givingChange || '0% from last week'}
                        changeType={stats.givingChangeType || 'increase'}
                        icon="fa-hand-holding-usd"
                        iconBgColor="bg-yellow-100"
                        iconTextColor="text-yellow-500"
                      />
                    </div>

                    {liveStreamStatus && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                          <span className="font-medium text-red-700">Live Stream is Active</span>
                          <button
                            onClick={() => setActiveTab('live')}
                            className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Manage Live Stream <i className="fas fa-arrow-right ml-1"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                      <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                      <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                          recentActivity.map((activity, index) => (
                            <ActivityItem
                              key={index}
                              icon={activity.icon || 'fa-info-circle'}
                              bgColor={activity.bgColor || 'bg-gray-100'}
                              text={activity.text || 'Unknown activity'}
                              time={activity.time || 'Unknown time'}
                            />
                          ))
                        ) : (
                          <p className="text-gray-500">No recent activity</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Prayer Requests</h4>
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-praying-hands text-blue-500"></i>
                          </div>
                        </div>
                        <p className="text-3xl font-bold">{stats.prayerRequests || 0}</p>
                        <p className="text-sm text-gray-500">Pending: {stats.pendingPrayers || 0}</p>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Events</h4>
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <i className="far fa-calendar-alt text-green-500"></i>
                          </div>
                        </div>
                        <p className="text-3xl font-bold">{stats.upcomingEvents || 0}</p>
                        <p className="text-sm text-gray-500">This week: {stats.thisWeekEvents || 0}</p>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Sermons</h4>
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-microphone-alt text-purple-500"></i>
                          </div>
                        </div>
                        <p className="text-3xl font-bold">{stats.totalSermons || 0}</p>
                        <p className="text-sm text-gray-500">This month: {stats.monthSermons || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">Upcoming Events</h3>
                          <button
                            className="text-[#FF7E45] hover:text-[#F4B942]"
                            onClick={() => openEventModal()}
                          >
                            <i className="fas fa-plus mr-1"></i> Add Event
                          </button>
                        </div>
                        <DataTable
                          columns={eventColumns}
                          data={(upcomingEvents || []).slice(0, 5)}
                          onEdit={openEventModal}
                          onDelete={(event) => openDeleteModal(event, 'event')}
                          emptyMessage="No upcoming events"
                        />
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">Recent Sermons</h3>
                          <button
                            className="text-[#FF7E45] hover:text-[#F4B942]"
                            onClick={() => openSermonModal()}
                          >
                            <i className="fas fa-plus mr-1"></i> Add Sermon
                          </button>
                        </div>
                        <DataTable
                          columns={sermonColumns}
                          data={(sermons || []).slice(0, 5)}
                          onEdit={openSermonModal}
                          onDelete={(sermon) => openDeleteModal(sermon, 'sermon')}
                          emptyMessage="No sermons available"
                        />
                      </div>
                    </div>
                  </div>
                </TabContentWrapper>
              )}

              {activeTab === 'users' && (
                <TabContentWrapper activeTab={activeTab} tabName="users">
                  <UsersManagement
                    users={Array.isArray(users) ? users : []}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={(user) => openDeleteModal(user, 'user')}
                    onCreateUser={handleCreateUser}
                  />
                </TabContentWrapper>
              )}

              {activeTab === 'ministries' && (
                <TabContentWrapper activeTab={activeTab} tabName="ministries">
                  <MinistriesManagement
                    ministries={ministries}
                    users={users}
                    onUpdateMinistry={handleUpdateMinistry}
                    onDeleteMinistry={(ministry) => openDeleteModal(ministry, 'ministry')}
                    onCreateMinistry={handleCreateMinistry}
                  />
                </TabContentWrapper>
              )}

              {activeTab === 'testimonials' && (
                <TabContentWrapper activeTab={activeTab} tabName="testimonials">
                  <TestimonialsManagement
                    testimonials={testimonials}
                    onUpdateTestimonial={handleUpdateTestimonial}
                    onDeleteTestimonial={(testimonial) => openDeleteModal(testimonial, 'testimonial')}
                    onCreateTestimonial={handleCreateTestimonial}
                  />
                </TabContentWrapper>
              )}

              {activeTab === 'blog' && (
                <TabContentWrapper activeTab={activeTab} tabName="blog">
                  <BlogManagement
                    posts={blogPosts}
                    onUpdatePost={handleUpdateBlogPost}
                    onDeletePost={(post) => openDeleteModal(post, 'blog')}
                    onCreatePost={handleCreateBlogPost}
                  />
                </TabContentWrapper>
              )}

              {activeTab === 'events' && (
                <TabContentWrapper activeTab={activeTab} tabName="events">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Events Management</h2>
                      <button
                        className="btn btn-primary"
                        onClick={() => openEventModal()}
                      >
                        <i className="fas fa-plus mr-2"></i> Add New Event
                      </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <DataTable
                        columns={eventColumns}
                        data={upcomingEvents}
                        onEdit={openEventModal}
                        onDelete={(event) => openDeleteModal(event, 'event')}
                        emptyMessage="No events available. Add your first event to get started."
                      />
                    </div>
                  </div>
                </TabContentWrapper>
              )}

              {activeTab === 'sermons' && (
                <TabContentWrapper activeTab={activeTab} tabName="sermons">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Sermons Management</h2>
                      <button
                        className="btn btn-primary"
                        onClick={() => openSermonModal()}
                      >
                        <i className="fas fa-plus mr-2"></i> Add New Sermon
                      </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <DataTable
                        columns={sermonColumns}
                        data={sermons}
                        onEdit={openSermonModal}
                        onDelete={(sermon) => openDeleteModal(sermon, 'sermon')}
                        emptyMessage="No sermons available. Add your first sermon to get started."
                      />
                    </div>
                  </div>
                </TabContentWrapper>
              )}

              {activeTab === 'donations' && (
                <TabContentWrapper activeTab={activeTab} tabName="donations">
                  <DonationsManagement
                    donations={donations}
                    onUpdateDonation={handleUpdateDonation}
                  />
                </TabContentWrapper>
              )}

              {activeTab === 'prayer' && (
                <TabContentWrapper activeTab={activeTab} tabName="prayer">
                  <PrayerRequestsManagement
                    prayerRequests={prayerRequests}
                    onUpdatePrayerRequest={handleUpdatePrayerRequest}
                    onDeletePrayerRequest={(prayer) => openDeleteModal(prayer, 'prayer')}
                  />
                </TabContentWrapper>
              )}

              {activeTab === 'live' && (
                <TabContentWrapper activeTab={activeTab} tabName="live">
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">Live Stream Management</h2>
                      <p className="text-gray-600">Manage your church's live streaming services.</p>
                    </div>

                    <LiveStreamControl
                      isLive={liveStreamStatus}
                      onStartLive={handleStartLiveStream}
                      onStopLive={handleStopLiveStream}
                      liveStats={liveStats}
                    />

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-bold mb-4">Quick Sermon Creation</h3>
                      <p className="text-gray-600 mb-4">
                        Create a sermon record for your live stream to make it available in the archive later.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => openSermonModal({
                          isLive: true,
                          date: new Date().toISOString().split('T')[0],
                          title: 'Live Service - ' + new Date().toLocaleDateString()
                        })}
                      >
                        <i className="fas fa-plus mr-2"></i> Create Live Sermon Record
                      </button>
                    </div>
                  </div>
                </TabContentWrapper>
              )}

              {activeTab === 'settings' && (
                <TabContentWrapper activeTab={activeTab} tabName="settings">
                  <div>
                    {/* Quick Settings Overview */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">System Settings</h2>
                      </div>
                      <h4 className="text-xl font-semibold mb-4">Current Settings Overview</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-700 mb-2">Church Info</h4>
                          <p className="text-sm text-gray-600">{settings.churchName || 'Not set'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-700 mb-2">Contact</h4>
                          <p className="text-sm text-gray-600">{settings.contactEmail || 'Not set'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-700 mb-2">Live Stream</h4>
                          <p className="text-sm text-gray-600">{settings.liveStreamUrl ? 'Configured' : 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <button
                        className="btn btn-primary"
                        onClick={openSettingsModal}
                      >
                        <i className="fas fa-cog mr-2"></i> Manage Settings
                      </button>
                    </div>
                  </div>
                </TabContentWrapper>
              )}
            </div>
          </div>
        </div>
      </section>

      <EventFormModal
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        onSubmit={handleEventSubmit}
        eventData={selectedEvent || {}}
        users={users}
      />

      <SermonFormModal
        isOpen={isSermonModalOpen}
        onClose={closeSermonModal}
        onSubmit={handleSermonSubmit}
        sermonData={selectedSermon || {}}
        users={users}
      />

      <Modal
        isOpen={isSettingsModalOpen}
        onClose={closeSettingsModal}
        title="System Settings"
        size="xl"
      >
        <SettingsForm
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetSettings}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
      />
    </div>
  );
};

export default AdminPage;