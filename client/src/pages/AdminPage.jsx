import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "../services/apiService";
import Loader from "../components/Loader";
import { useAlert } from "../utils/Alert";
import { useForm } from "../hooks/useForm";
import useAuth from "../hooks/useAuth";

/* ====================================== Reusable Components ====================================== */

// StatCard Component
const StatCard = ({
  title,
  value,
  change,
  changeType,
  icon,
  iconBgColor,
  iconTextColor,
}) => (
  <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
    <div className="flex justify-between items-center">
      <div className="flex-1">
        <p className="text-xs md:text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-xl md:text-3xl font-bold">{value}</h3>
        <p
          className={`text-xs ${changeType === "increase" ? "text-green-600" : "text-red-600"} mt-1 md:mt-2`}
        >
          <i
            className={`fas ${changeType === "increase" ? "fa-arrow-up" : "fa-arrow-down"} mr-1`}
          />
          {change}
        </p>
      </div>
      <div
        className={`w-8 h-8 md:w-12 md:h-12 ${iconBgColor} rounded-full flex items-center justify-center ml-2`}
      >
        <i className={`fas ${icon} ${iconTextColor} text-lg md:text-xl`} />
      </div>
    </div>
  </div>
);

// SidebarButton Component
const SidebarButton = ({ label, icon, tabName, activeTab, onClick }) => (
  <li>
    <button
      className={`w-full text-left px-4 py-2 rounded-md flex items-center ${activeTab === tabName ? "bg-[#FF7E45] text-white" : "hover:bg-gray-100"}`}
      onClick={() => onClick(tabName)}
      aria-current={activeTab === tabName ? "page" : undefined}
      aria-label={`${label} tab`}
    >
      <i className={`${icon} mr-3`} aria-hidden="true" />
      <span>{label}</span>
    </button>
  </li>
);

// ActivityItem Component
const ActivityItem = ({ icon, bgColor, text, time }) => (
  <div className="flex items-start">
    <div
      className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}
    >
      <i className={`fas ${icon}`} />
    </div>
    <div>
      <p className="font-medium">{text}</p>
      <p className="text-sm text-gray-500">{time}</p>
    </div>
  </div>
);

// DataTable Component
const DataTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage,
  actions = true,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th key={column.key} className="py-3 px-4 text-left">
                {column.title}
              </th>
            ))}
            {actions && <th className="py-3 px-4 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <tr key={item._id || item.id} className="border-b">
                {columns.map((column) => (
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
                      <i className="fas fa-edit" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="text-gray-500 hover:text-red-500"
                      aria-label={`Delete ${item.title || item.name}`}
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={actions ? columns.length + 1 : columns.length}
                className="py-4 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 id="modal-title" className="text-xl font-bold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="p-6">{children}</div>
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

/* ====================================== Components for Each Tab ====================================== */

// Users Management Component
const UsersManagement = ({
  users,
  onUpdateUser,
  onDeleteUser,
  onCreateUser,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const alert = useAlert();

  const { values, handleChange, setValues, resetForm } = useForm({
    name: "",
    email: "",
    phone: "",
    role: "user",
    status: "active",
    joinDate: new Date().toISOString().split("T")[0],
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (selectedUser) {
      setValues({
        name: selectedUser.name || "",
        email: selectedUser.email || "",
        phone: selectedUser.phone || "",
        role: selectedUser.role || "user",
        status: selectedUser.status || "active",
        joinDate: selectedUser.joinDate
          ? new Date(selectedUser.joinDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        address: selectedUser.address || "",
        notes: selectedUser.notes || "",
      });
    }
  }, [selectedUser, setValues]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await onUpdateUser(selectedUser._id, values);
      } else {
        await onCreateUser(values);
      }
      setShowCreateModal(false);
      setSelectedUser(null);
      resetForm();
      alert.success(
        `User ${selectedUser ? "updated" : "created"} successfully`,
      );
    } catch (error) {
      alert.error(`Failed to ${selectedUser ? "update" : "create"} user`);
    }
  };

  const userColumns = [
    {
      key: "user",
      title: "User",
      render: (user) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">
              Joined: {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    { key: "email", title: "Email" },
    {
      key: "role",
      title: "Role",
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.role === "admin"
              ? "bg-purple-100 text-purple-800"
              : user.role === "moderator"
                ? "bg-blue-100 text-blue-800"
                : user.role === "staff"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.status === "active"
              ? "bg-green-100 text-green-800"
              : user.status === "inactive"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {user.status}
        </span>
      ),
    },
  ];

  return (
    <div>
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
          >
            <i className="fas fa-plus mr-2" /> New User
          </button>
        </div>
      </div>

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

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        title={selectedUser ? "Edit User" : "Create New User"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name*
              </label>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                className="form-input"
                required
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Join Date
              </label>
              <input
                type="date"
                name="joinDate"
                value={values.joinDate}
                onChange={handleChange}
                className="form-input"
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
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedUser ? "Update" : "Create"} User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Ministries Management Component
const MinistriesManagement = ({
  ministries,
  users,
  onUpdateMinistry,
  onDeleteMinistry,
  onCreateMinistry,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [ministryCategories, setMinistryCategories] = useState([]);
  const alert = useAlert();

  const { values, handleChange, setValues, resetForm } = useForm({
    name: "",
    description: "",
    leader: "",
    coLeaders: [],
    meetingTimes: "",
    location: "",
    category: "",
    status: "active",
    image: "",
    objectives: "",
    targetAudience: "",
    contactEmail: "",
    contactPhone: "",
  });

  useEffect(() => {
    if (selectedMinistry) {
      setValues({
        name: selectedMinistry.name || "",
        description: selectedMinistry.description || "",
        leader: selectedMinistry.leader || "",
        coLeaders: selectedMinistry.coLeaders || [],
        meetingTimes: selectedMinistry.meetingTimes || "",
        location: selectedMinistry.location || "",
        category: selectedMinistry.category || "",
        status: selectedMinistry.status || "active",
        image: selectedMinistry.image || "",
        objectives: selectedMinistry.objectives || "",
        targetAudience: selectedMinistry.targetAudience || "",
        contactEmail: selectedMinistry.contactEmail || "",
        contactPhone: selectedMinistry.contactPhone || "",
      });
    }
  }, [selectedMinistry, setValues]);

  useEffect(() => {
    // Fetch ministry categories
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.MINISTRIES.CATEGORIES,
        );
        setMinistryCategories(response.categories || []);
      } catch (error) {
        console.error("Error fetching ministry categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const filteredMinistries = ministries.filter((ministry) => {
    const matchesSearch = ministry.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ministry.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || ministry.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedMinistry) {
        await onUpdateMinistry(selectedMinistry._id, values);
      } else {
        await onCreateMinistry(values);
      }
      setShowCreateModal(false);
      setSelectedMinistry(null);
      resetForm();
      alert.success(
        `Ministry ${selectedMinistry ? "updated" : "created"} successfully`,
      );
    } catch (error) {
      alert.error(
        `Failed to ${selectedMinistry ? "update" : "create"} ministry`,
      );
    }
  };

  const addCoLeader = () => {
    setValues({
      ...values,
      coLeaders: [...values.coLeaders, ""],
    });
  };

  const removeCoLeader = (index) => {
    const updatedCoLeaders = [...values.coLeaders];
    updatedCoLeaders.splice(index, 1);
    setValues({ ...values, coLeaders: updatedCoLeaders });
  };

  const updateCoLeader = (index, value) => {
    const updatedCoLeaders = [...values.coLeaders];
    updatedCoLeaders[index] = value;
    setValues({ ...values, coLeaders: updatedCoLeaders });
  };

  const ministryColumns = [
    {
      key: "name",
      title: "Ministry Name",
      render: (ministry) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
            {ministry.name?.charAt(0)?.toUpperCase() || "M"}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {ministry.name}
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(ministry.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "leader",
      title: "Leader",
      render: (ministry) => {
        const leaderUser = users.find((u) => u._id === ministry.leader);
        return leaderUser ? leaderUser.name : "Not assigned";
      },
    },
    { key: "category", title: "Category" },
    {
      key: "status",
      title: "Status",
      render: (ministry) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            ministry.status === "active"
              ? "bg-green-100 text-green-800"
              : ministry.status === "inactive"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {ministry.status}
        </span>
      ),
    },
  ];

  // Filter users who can be leaders (staff, moderators, admins)
  const potentialLeaders = users.filter(
    (user) =>
      ["admin", "moderator", "staff", "volunteer"].includes(user.role) &&
      user.status === "active",
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">Ministries Management</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search ministries..."
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
            {ministryCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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
              setSelectedMinistry(null);
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <i className="fas fa-plus mr-2" /> New Ministry
          </button>
        </div>
      </div>

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

      {/* Create/Edit Ministry Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedMinistry(null);
          resetForm();
        }}
        title={selectedMinistry ? "Edit Ministry" : "Create New Ministry"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ministry Name*
              </label>
              <input
                type="text"
                name="name"
                value={values.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Category*
              </label>
              <select
                name="category"
                value={values.category}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select a category</option>
                {ministryCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description*
            </label>
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
              <label className="block text-sm font-medium mb-1">Leader*</label>
              <select
                name="leader"
                value={values.leader}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select a leader</option>
                {potentialLeaders.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
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
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Co-Leaders</label>
              <button
                type="button"
                onClick={addCoLeader}
                className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
              >
                + Add Co-Leader
              </button>
            </div>
            {values.coLeaders.map((coLeader, index) => (
              <div key={index} className="flex mb-2">
                <select
                  value={coLeader}
                  onChange={(e) => updateCoLeader(index, e.target.value)}
                  className="form-input flex-1"
                >
                  <option value="">Select a co-leader</option>
                  {potentialLeaders.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeCoLeader(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Meeting Times
              </label>
              <input
                type="text"
                name="meetingTimes"
                value={values.meetingTimes}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Every Tuesday at 7 PM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={values.location}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Main Hall, Room 101"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={values.contactEmail}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={values.contactPhone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Target Audience
            </label>
            <input
              type="text"
              name="targetAudience"
              value={values.targetAudience}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Youth, Adults, Seniors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Objectives</label>
            <textarea
              name="objectives"
              value={values.objectives}
              onChange={handleChange}
              className="form-input"
              rows="2"
              placeholder="Main goals and objectives of this ministry"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              name="image"
              value={values.image}
              onChange={handleChange}
              className="form-input"
              placeholder="https://example.com/ministry-image.jpg"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setSelectedMinistry(null);
                resetForm();
              }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedMinistry ? "Update" : "Create"} Ministry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Testimonials Management Component
const TestimonialsManagement = ({
  testimonials,
  onUpdateTestimonial,
  onDeleteTestimonial,
  onCreateTestimonial,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const alert = useAlert();

  const { values, handleChange, setValues, resetForm } = useForm({
    author: "",
    content: "",
    status: "pending",
    videoUrl: "",
    imageUrl: "",
    category: "general",
    featured: false,
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (selectedTestimonial) {
      setValues({
        author: selectedTestimonial.author || "",
        content: selectedTestimonial.content || "",
        status: selectedTestimonial.status || "pending",
        videoUrl: selectedTestimonial.videoUrl || "",
        imageUrl: selectedTestimonial.imageUrl || "",
        category: selectedTestimonial.category || "general",
        featured: selectedTestimonial.featured || false,
        date: selectedTestimonial.date
          ? new Date(selectedTestimonial.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    }
  }, [selectedTestimonial, setValues]);

  const filteredTestimonials = testimonials.filter((testimonial) => {
    const matchesSearch =
      testimonial.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || testimonial.status === statusFilter;
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
      alert.success(
        `Testimonial ${selectedTestimonial ? "updated" : "created"} successfully`,
      );
    } catch (error) {
      alert.error(
        `Failed to ${selectedTestimonial ? "update" : "create"} testimonial`,
      );
    }
  };

  const testimonialColumns = [
    {
      key: "author",
      title: "Author",
      render: (testimonial) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
            {testimonial.author?.charAt(0)?.toUpperCase() || "T"}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {testimonial.author}
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(testimonial.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "content",
      title: "Content",
      render: (testimonial) => (
        <p className="text-sm text-gray-700 line-clamp-2">
          {testimonial.content}
        </p>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (testimonial) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            testimonial.status === "published"
              ? "bg-green-100 text-green-800"
              : testimonial.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {testimonial.status}
        </span>
      ),
    },
    {
      key: "featured",
      title: "Featured",
      render: (testimonial) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            testimonial.featured
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {testimonial.featured ? "Yes" : "No"}
        </span>
      ),
    },
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
            <i className="fas fa-plus mr-2" /> New Testimonial
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
        title={
          selectedTestimonial ? "Edit Testimonial" : "Create New Testimonial"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Author Name*
              </label>
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
            <label className="block text-sm font-medium mb-1">
              Testimonial Content*
            </label>
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
              <label className="block text-sm font-medium mb-1">
                Video URL
              </label>
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
              <label className="block text-sm font-medium mb-1">
                Image URL
              </label>
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
              onChange={(e) =>
                handleChange({
                  target: { name: "featured", value: e.target.checked },
                })
              }
              className="form-checkbox h-4 w-4 text-[#FF7E45]"
              id="featuredTestimonial"
            />
            <label
              htmlFor="featuredTestimonial"
              className="ml-2 text-sm font-medium"
            >
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
              {selectedTestimonial ? "Update" : "Create"} Testimonial
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Blog Management Component
const BlogManagement = ({
  posts,
  onUpdatePost,
  onDeletePost,
  onCreatePost,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [blogCategories, setBlogCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const alert = useAlert();

  const { values, handleChange, setValues, resetForm } = useForm({
    title: "",
    content: "",
    excerpt: "",
    author: "",
    status: "draft",
    category: "",
    tags: [],
    featuredImage: "",
    publishedAt: new Date().toISOString().split("T")[0],
    metaTitle: "",
    metaDescription: "",
    featured: false,
  });

  useEffect(() => {
    if (selectedPost) {
      setValues({
        title: selectedPost.title || "",
        content: selectedPost.content || "",
        excerpt: selectedPost.excerpt || "",
        author: selectedPost.author || "",
        status: selectedPost.status || "draft",
        category: selectedPost.category || "",
        tags: selectedPost.tags || [],
        featuredImage: selectedPost.featuredImage || "",
        publishedAt: selectedPost.publishedAt
          ? new Date(selectedPost.publishedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        metaTitle: selectedPost.metaTitle || "",
        metaDescription: selectedPost.metaDescription || "",
        featured: selectedPost.featured || false,
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
        console.error("Error fetching blog categories:", error);
      }
    };

    // Fetch potential authors (users with appropriate roles)
    const fetchAuthors = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.USERS.BASE);
        const authorUsers = response.users.filter(
          (user) =>
            ["admin", "moderator", "staff"].includes(user.role) &&
            user.status === "active",
        );
        setAuthors(authorUsers);
      } catch (error) {
        console.error("Error fetching authors:", error);
      }
    };

    fetchCategories();
    fetchAuthors();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || post.category === categoryFilter;
    const matchesAuthor =
      authorFilter === "all" || post.author === authorFilter;
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
      alert.success(
        `Blog post ${selectedPost ? "updated" : "created"} successfully`,
      );
    } catch (error) {
      alert.error(`Failed to ${selectedPost ? "update" : "create"} blog post`);
    }
  };

  const addTag = () => {
    setValues({
      ...values,
      tags: [...values.tags, ""],
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
      key: "title",
      title: "Title",
      render: (post) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{post.title}</div>
          <div className="text-sm text-gray-500">
            By {post.authorName} on{" "}
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    { key: "category", title: "Category" },
    {
      key: "status",
      title: "Status",
      render: (post) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            post.status === "published"
              ? "bg-green-100 text-green-800"
              : post.status === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {post.status}
        </span>
      ),
    },
    {
      key: "featured",
      title: "Featured",
      render: (post) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            post.featured
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {post.featured ? "Yes" : "No"}
        </span>
      ),
    },
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
            {blogCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
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
            {authors.map((author) => (
              <option key={author._id} value={author._id}>
                {author.name}
              </option>
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
            <i className="fas fa-plus mr-2" /> New Post
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
        title={selectedPost ? "Edit Blog Post" : "Create New Blog Post"}
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
                {authors.map((author) => (
                  <option key={author._id} value={author._id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Category*
              </label>
              <select
                name="category"
                value={values.category}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="">Select a category</option>
                {blogCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
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
              <label className="block text-sm font-medium mb-1">
                Publish Date
              </label>
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
                  <i className="fas fa-times" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Featured Image URL
              </label>
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
                onChange={(e) =>
                  handleChange({
                    target: { name: "featured", value: e.target.checked },
                  })
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="featuredPost"
              />
              <label
                htmlFor="featuredPost"
                className="ml-2 text-sm font-medium"
              >
                Feature this post
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Meta Title (SEO)
            </label>
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
            <label className="block text-sm font-medium mb-1">
              Meta Description (SEO)
            </label>
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
              {selectedPost ? "Update" : "Create"} Post
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Donations Management Component
const DonationsManagement = ({ donations, onUpdateDonation }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredDonations = donations.filter((donation) => {
    const matchesStatus =
      statusFilter === "all" || donation.status === statusFilter;
    const matchesMethod =
      methodFilter === "all" || donation.paymentMethod === methodFilter;

    let matchesDate = true;
    if (dateFilter === "today") {
      const today = new Date().toDateString();
      matchesDate = new Date(donation.createdAt).toDateString() === today;
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(donation.createdAt) >= weekAgo;
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(donation.createdAt) >= monthAgo;
    } else if (dateFilter === "year") {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      matchesDate = new Date(donation.createdAt) >= yearAgo;
    }

    return matchesStatus && matchesMethod && matchesDate;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const donationColumns = [
    {
      key: "donor",
      title: "Donor",
      render: (donation) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {donation.donorName || "Anonymous"}
          </div>
          <div className="text-sm text-gray-500">
            {donation.donorEmail || "No email provided"}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (donation) => formatCurrency(donation.amount),
    },
    {
      key: "date",
      title: "Date",
      render: (donation) => new Date(donation.createdAt).toLocaleDateString(),
    },
    {
      key: "method",
      title: "Method",
      render: (donation) =>
        donation.paymentMethod
          ? donation.paymentMethod.charAt(0).toUpperCase() +
            donation.paymentMethod.slice(1)
          : "Unknown",
    },
    {
      key: "type",
      title: "Type",
      render: (donation) => (donation.recurring ? "Recurring" : "One-time"),
    },
    {
      key: "status",
      title: "Status",
      render: (donation) => (
        <select
          value={donation.status}
          onChange={(e) =>
            onUpdateDonation(donation._id, { status: e.target.value })
          }
          className="form-input text-sm"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      ),
    },
  ];

  const totalAmount = filteredDonations.reduce(
    (sum, donation) => sum + donation.amount,
    0,
  );

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
            <i className="fas fa-download mr-2" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              Total: {formatCurrency(totalAmount)}
            </h3>
            <p className="text-sm text-gray-500">
              {filteredDonations.length} donations
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Recurring donations</p>
            <p className="font-semibold">
              {formatCurrency(
                filteredDonations
                  .filter((d) => d.recurring)
                  .reduce((sum, d) => sum + d.amount, 0),
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <DataTable
          columns={donationColumns}
          data={filteredDonations}
          onEdit={() => {}}
          onDelete={() => {}}
          emptyMessage="No donations found matching your criteria"
        />
      </div>
    </div>
  );
};

// Prayer Requests Management Component
const PrayerRequestsManagement = ({
  prayerRequests,
  onUpdatePrayerRequest,
  onDeletePrayerRequest,
}) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [privacyFilter, setPrivacyFilter] = useState("all");

  const filteredPrayerRequests = prayerRequests.filter((request) => {
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || request.category === categoryFilter;
    const matchesPrivacy =
      privacyFilter === "all" ||
      (privacyFilter === "public" && request.isPublic) ||
      (privacyFilter === "private" && !request.isPublic);
    return matchesStatus && matchesCategory && matchesPrivacy;
  });

  const prayerColumns = [
    {
      key: "name",
      title: "Name",
      render: (request) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {request.name || "Anonymous"}
          </div>
          <div className="text-sm text-gray-500">
            {request.email || "No email provided"}
          </div>
        </div>
      ),
    },
    {
      key: "request",
      title: "Request",
      render: (request) => (
        <div className="text-sm text-gray-900 line-clamp-2">
          {request.request}
        </div>
      ),
    },
    { key: "category", title: "Category" },
    {
      key: "privacy",
      title: "Privacy",
      render: (request) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            request.isPublic
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {request.isPublic ? "Public" : "Private"}
        </span>
      ),
    },
    { key: "prayerCount", title: "Prayers" },
    {
      key: "status",
      title: "Status",
      render: (request) => (
        <select
          value={request.status}
          onChange={(e) =>
            onUpdatePrayerRequest(request._id, { status: e.target.value })
          }
          className="form-input text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="answered">Answered</option>
          <option value="rejected">Rejected</option>
        </select>
      ),
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
          onEdit={() => {}}
          onDelete={(request) => onDeletePrayerRequest(request._id)}
          emptyMessage="No prayer requests found matching your criteria"
        />
      </div>
    </div>
  );
};

// Event Form Modal Component
const EventFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  eventData = {},
  users,
}) => {
  const { values, handleChange, setValues } = useForm({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    address: {},
    category: "service",
    imageUrl: "",
    capacity: 0,
    requiresRSVP: false,
    price: 0,
    leaders: [],
    tags: [],
    ...eventData,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  const addLeader = () => {
    setValues({
      ...values,
      leaders: [...values.leaders, { userId: "", role: "" }],
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
      tags: [...values.tags, ""],
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
      document.querySelector(".form-input")?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter users who can be leaders (staff, moderators, admins, volunteers)
  const potentialLeaders = users.filter(
    (user) =>
      ["admin", "moderator", "staff", "volunteer"].includes(user.role) &&
      user.status === "active",
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventData._id ? "Edit Event" : "Create Event"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Event Title*
            </label>
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
            <label className="block text-sm font-medium mb-1">
              Start Time*
            </label>
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
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2"
            >
              <select
                value={leader.userId}
                onChange={(e) => updateLeader(index, "userId", e.target.value)}
                className="form-input"
              >
                <option value="">Select a leader</option>
                {potentialLeaders.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Role"
                  value={leader.role}
                  onChange={(e) => updateLeader(index, "role", e.target.value)}
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeLeader(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times" />
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
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {eventData._id ? "Update" : "Create"} Event
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Sermon Form Modal Component
const SermonFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  sermonData = {},
  users,
}) => {
  const { values, handleChange, setValues } = useForm({
    title: "",
    speaker: "",
    description: "",
    scripture: "",
    category: "sunday-service",
    date: "",
    duration: "00:00",
    videoUrl: "",
    audioUrl: "",
    imageUrl: "",
    isLive: false,
    liveStreamUrl: "",
    tags: [],
    series: "",
    seriesPart: "",
    ...sermonData,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  const addTag = () => {
    setValues({
      ...values,
      tags: [...values.tags, ""],
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
      document.querySelector(".form-input")?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter users who can be speakers (staff, moderators, admins, volunteers)
  const potentialSpeakers = users.filter(
    (user) =>
      ["admin", "moderator", "staff", "volunteer"].includes(user.role) &&
      user.status === "active",
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sermonData._id ? "Edit Sermon" : "Create Sermon"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Sermon Title*
            </label>
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
              {potentialSpeakers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
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
            <label className="block text-sm font-medium mb-1">
              Scripture Reference
            </label>
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
            <label className="block text-sm font-medium mb-1">
              Series Part
            </label>
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
            <label
              htmlFor="isLiveCheckbox"
              className="ml-2 text-sm font-medium"
            >
              This is a live stream
            </label>
          </div>

          {values.isLive ? (
            <div>
              <label className="block text-sm font-medium mb-1">
                Live Stream URL*
              </label>
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
                <label className="block text-sm font-medium mb-1">
                  Video URL
                </label>
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
                <label className="block text-sm font-medium mb-1">
                  Audio URL
                </label>
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
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {sermonData._id ? "Update" : "Create"} Sermon
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
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
            <span className="font-medium text-red-600">Live Stream Active</span>
          </div>

          {liveStats && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Viewers:</span>
                <span className="font-medium ml-2">
                  {liveStats.viewers || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium ml-2">
                  {liveStats.duration || "0:00"}
                </span>
              </div>
            </div>
          )}

          <button onClick={onStopLive} className="btn btn-danger">
            <i className="fas fa-stop mr-2" /> End Live Stream
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <i className="fas fa-info-circle mr-1" />
              Your live stream is currently active and visible to members and
              guests.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2" />
            <span className="font-medium text-gray-600">
              No Active Live Stream
            </span>
          </div>

          <button onClick={onStartLive} className="btn btn-primary">
            <i className="fas fa-broadcast-tower mr-2" /> Start Live Stream
          </button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              <i className="fas fa-exclamation-triangle mr-1" />
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
    churchName: settings.churchName || "",
    churchAddress: settings.churchAddress || {},
    contactEmail: settings.contactEmail || "",
    contactPhone: settings.contactPhone || "",
    pastorName: settings.pastorName || "",
    serviceTimes: settings.serviceTimes || [],
    socialMedia: settings.socialMedia || {},
    liveStreamUrl: settings.liveStreamUrl || "",
    givingOptions: settings.givingOptions || {},
    emailSettings: settings.emailSettings || {},
    sermonSettings: settings.sermonSettings || {},
    eventSettings: settings.eventSettings || {},
    prayerRequestSettings: settings.prayerRequestSettings || {},
    testimonialSettings: settings.testimonialSettings || {},
    blogSettings: settings.blogSettings || {},
    ministrySettings: settings.ministrySettings || {},
    ...settings,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateSettings(values);
  };

  const addServiceTime = () => {
    setValues({
      ...values,
      serviceTimes: [
        ...values.serviceTimes,
        { day: "", time: "", description: "" },
      ],
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
        [field]: value,
      },
    });
  };

  const updateSocialMedia = (platform, value) => {
    setValues({
      ...values,
      socialMedia: {
        ...values.socialMedia,
        [platform]: value,
      },
    });
  };

  const updateGivingOptions = (field, value) => {
    setValues({
      ...values,
      givingOptions: {
        ...values.givingOptions,
        [field]: value,
      },
    });
  };

  const updateEmailSettings = (field, value) => {
    setValues({
      ...values,
      emailSettings: {
        ...values.emailSettings,
        [field]: value,
      },
    });
  };

  const updateSermonSettings = (field, value) => {
    setValues({
      ...values,
      sermonSettings: {
        ...values.sermonSettings,
        [field]: value,
      },
    });
  };

  const updateEventSettings = (field, value) => {
    setValues({
      ...values,
      eventSettings: {
        ...values.eventSettings,
        [field]: value,
      },
    });
  };

  const updatePrayerRequestSettings = (field, value) => {
    setValues({
      ...values,
      prayerRequestSettings: {
        ...values.prayerRequestSettings,
        [field]: value,
      },
    });
  };

  const updateTestimonialSettings = (field, value) => {
    setValues({
      ...values,
      testimonialSettings: {
        ...values.testimonialSettings,
        [field]: value,
      },
    });
  };

  const updateBlogSettings = (field, value) => {
    setValues({
      ...values,
      blogSettings: {
        ...values.blogSettings,
        [field]: value,
      },
    });
  };

  const updateMinistrySettings = (field, value) => {
    setValues({
      ...values,
      ministrySettings: {
        ...values.ministrySettings,
        [field]: value,
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Church Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Church Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Church Name*
              </label>
              <input
                type="text"
                name="churchName"
                value={values.churchName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Pastor Name
              </label>
              <input
                type="text"
                name="pastorName"
                value={values.pastorName}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Church Address
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street"
                value={values.churchAddress.street || ""}
                onChange={(e) => updateAddress("street", e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="City"
                value={values.churchAddress.city || ""}
                onChange={(e) => updateAddress("city", e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="State"
                value={values.churchAddress.state || ""}
                onChange={(e) => updateAddress("state", e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={values.churchAddress.zipCode || ""}
                onChange={(e) => updateAddress("zipCode", e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={values.contactEmail}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={values.contactPhone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Service Times */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Service Times</h3>
            <button
              type="button"
              onClick={addServiceTime}
              className="text-sm text-[#FF7E45] hover:text-[#F4B942]"
            >
              + Add Service Time
            </button>
          </div>
          {values.serviceTimes.map((service, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2"
            >
              <input
                type="text"
                placeholder="Day (e.g., Sunday)"
                value={service.day}
                onChange={(e) =>
                  updateServiceTime(index, "day", e.target.value)
                }
                className="form-input"
              />
              <input
                type="text"
                placeholder="Time (e.g., 10:00 AM)"
                value={service.time}
                onChange={(e) =>
                  updateServiceTime(index, "time", e.target.value)
                }
                className="form-input"
              />
              <div className="flex">
                <input
                  type="text"
                  placeholder="Description"
                  value={service.description}
                  onChange={(e) =>
                    updateServiceTime(index, "description", e.target.value)
                  }
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeServiceTime(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Social Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <i className="fab fa-facebook text-blue-600 mr-2 w-5" />
              <input
                type="url"
                placeholder="Facebook URL"
                value={values.socialMedia.facebook || ""}
                onChange={(e) => updateSocialMedia("facebook", e.target.value)}
                className="form-input flex-1"
              />
            </div>
            <div className="flex items-center">
              <i className="fab fa-instagram text-pink-600 mr-2 w-5" />
              <input
                type="url"
                placeholder="Instagram URL"
                value={values.socialMedia.instagram || ""}
                onChange={(e) => updateSocialMedia("instagram", e.target.value)}
                className="form-input flex-1"
              />
            </div>
            <div className="flex items-center">
              <i className="fab fa-twitter text-blue-400 mr-2 w-5" />
              <input
                type="url"
                placeholder="Twitter URL"
                value={values.socialMedia.twitter || ""}
                onChange={(e) => updateSocialMedia("twitter", e.target.value)}
                className="form-input flex-1"
              />
            </div>
            <div className="flex items-center">
              <i className="fab fa-youtube text-red-600 mr-2 w-5" />
              <input
                type="url"
                placeholder="YouTube URL"
                value={values.socialMedia.youtube || ""}
                onChange={(e) => updateSocialMedia("youtube", e.target.value)}
                className="form-input flex-1"
              />
            </div>
          </div>
        </div>

        {/* Live Stream */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Live Stream</h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              Live Stream URL
            </label>
            <input
              type="url"
              name="liveStreamUrl"
              value={values.liveStreamUrl}
              onChange={handleChange}
              className="form-input"
              placeholder="https://youtube.com/live/..."
            />
          </div>
        </div>

        {/* Giving Options */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Giving Options</h3>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="enableOnlineGiving"
              checked={values.givingOptions.enableOnlineGiving || false}
              onChange={(e) =>
                updateGivingOptions("enableOnlineGiving", e.target.checked)
              }
              className="form-checkbox h-4 w-4 text-[#FF7E45]"
              id="enableOnlineGiving"
            />
            <label
              htmlFor="enableOnlineGiving"
              className="ml-2 text-sm font-medium"
            >
              Enable Online Giving
            </label>
          </div>
          {values.givingOptions.enableOnlineGiving && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Stripe Publishable Key
                </label>
                <input
                  type="text"
                  value={values.givingOptions.stripePublishableKey || ""}
                  onChange={(e) =>
                    updateGivingOptions("stripePublishableKey", e.target.value)
                  }
                  className="form-input"
                  placeholder="pk_test_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Stripe Secret Key
                </label>
                <input
                  type="password"
                  value={values.givingOptions.stripeSecretKey || ""}
                  onChange={(e) =>
                    updateGivingOptions("stripeSecretKey", e.target.value)
                  }
                  className="form-input"
                  placeholder="sk_test_..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Email Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                value={values.emailSettings.host || ""}
                onChange={(e) => updateEmailSettings("host", e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                value={values.emailSettings.port || ""}
                onChange={(e) =>
                  updateEmailSettings("port", parseInt(e.target.value) || "")
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                SMTP Username
              </label>
              <input
                type="text"
                value={values.emailSettings.auth?.user || ""}
                onChange={(e) =>
                  updateEmailSettings("auth", {
                    ...values.emailSettings.auth,
                    user: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                SMTP Password
              </label>
              <input
                type="password"
                value={values.emailSettings.auth?.pass || ""}
                onChange={(e) =>
                  updateEmailSettings("auth", {
                    ...values.emailSettings.auth,
                    pass: e.target.value,
                  })
                }
                className="form-input"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={values.emailSettings.secure || false}
                onChange={(e) =>
                  updateEmailSettings("secure", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="secureSMTP"
              />
              <label htmlFor="secureSMTP" className="ml-2 text-sm font-medium">
                Use SSL/TLS
              </label>
            </div>
          </div>
        </div>

        {/* Module Settings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Module Settings</h3>

          {/* Sermon Settings */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Sermon Settings</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={values.sermonSettings.autoPublish || false}
                onChange={(e) =>
                  updateSermonSettings("autoPublish", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="autoPublishSermons"
              />
              <label
                htmlFor="autoPublishSermons"
                className="ml-2 text-sm font-medium"
              >
                Auto-publish new sermons
              </label>
            </div>
          </div>

          {/* Blog Settings */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Blog Settings</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={values.blogSettings.enableComments || false}
                onChange={(e) =>
                  updateBlogSettings("enableComments", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="enableBlogComments"
              />
              <label
                htmlFor="enableBlogComments"
                className="ml-2 text-sm font-medium"
              >
                Enable blog comments
              </label>
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={values.blogSettings.requireApproval || false}
                onChange={(e) =>
                  updateBlogSettings("requireApproval", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="requireBlogApproval"
              />
              <label
                htmlFor="requireBlogApproval"
                className="ml-2 text-sm font-medium"
              >
                Require blog post approval
              </label>
            </div>
          </div>

          {/* Ministry Settings */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Ministry Settings</h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={values.ministrySettings.enableVolunteerSignup || false}
                onChange={(e) =>
                  updateMinistrySettings(
                    "enableVolunteerSignup",
                    e.target.checked,
                  )
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="enableVolunteerSignup"
              />
              <label
                htmlFor="enableVolunteerSignup"
                className="ml-2 text-sm font-medium"
              >
                Enable volunteer signup
              </label>
            </div>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={values.ministrySettings.showLeaders || true}
                onChange={(e) =>
                  updateMinistrySettings("showLeaders", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="showMinistryLeaders"
              />
              <label
                htmlFor="showMinistryLeaders"
                className="ml-2 text-sm font-medium"
              >
                Show ministry leaders publicly
              </label>
            </div>
          </div>

          {/* Event Settings */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Event Settings</h4>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={values.eventSettings.requireApproval || false}
                onChange={(e) =>
                  updateEventSettings("requireApproval", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="requireEventApproval"
              />
              <label
                htmlFor="requireEventApproval"
                className="ml-2 text-sm font-medium"
              >
                Require event approval
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={values.eventSettings.allowPublicRSVP || true}
                onChange={(e) =>
                  updateEventSettings("allowPublicRSVP", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="allowPublicRSVP"
              />
              <label
                htmlFor="allowPublicRSVP"
                className="ml-2 text-sm font-medium"
              >
                Allow public RSVP
              </label>
            </div>
          </div>

          {/* Prayer Request Settings */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Prayer Request Settings</h4>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={values.prayerRequestSettings.requireApproval || true}
                onChange={(e) =>
                  updatePrayerRequestSettings(
                    "requireApproval",
                    e.target.checked,
                  )
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="requirePrayerApproval"
              />
              <label
                htmlFor="requirePrayerApproval"
                className="ml-2 text-sm font-medium"
              >
                Require prayer request approval
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={values.prayerRequestSettings.allowAnonymous || true}
                onChange={(e) =>
                  updatePrayerRequestSettings(
                    "allowAnonymous",
                    e.target.checked,
                  )
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="allowAnonymousPrayer"
              />
              <label
                htmlFor="allowAnonymousPrayer"
                className="ml-2 text-sm font-medium"
              >
                Allow anonymous prayer requests
              </label>
            </div>
          </div>

          {/* Testimonial Settings */}
          <div>
            <h4 className="font-medium mb-2">Testimonial Settings</h4>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={values.testimonialSettings.requireApproval || true}
                onChange={(e) =>
                  updateTestimonialSettings("requireApproval", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="requireTestimonialApproval"
              />
              <label
                htmlFor="requireTestimonialApproval"
                className="ml-2 text-sm font-medium"
              >
                Require testimonial approval
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={values.testimonialSettings.allowVideo || true}
                onChange={(e) =>
                  updateTestimonialSettings("allowVideo", e.target.checked)
                }
                className="form-checkbox h-4 w-4 text-[#FF7E45]"
                id="allowVideoTestimonials"
              />
              <label
                htmlFor="allowVideoTestimonials"
                className="ml-2 text-sm font-medium"
              >
                Allow video testimonials
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={() => setValues(settings)}
            className="btn btn-outline"
          >
            Reset
          </button>
          <button type="submit" className="btn btn-primary">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

// Main AdminPage Component
const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
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
  const [deleteType, setDeleteType] = useState("");
  const [deleteItem, setDeleteItem] = useState(null);
  const [liveStreamStatus, setLiveStreamStatus] = useState(false);
  const [liveStats, setLiveStats] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const alert = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    document.title =
      "SMC: - Admin | St. Micheal`s & All Angels Church | Ifite-Awka";

    if (user && (user.role === "admin" || user.role === "moderator")) {
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

      // Use Promise.allSettled to handle partial failures gracefully
      const [
        statsResponse,
        activityResponse,
        usersResponse,
        ministriesResponse,
        testimonialsResponse,
        blogResponse,
        eventsResponse,
        sermonsResponse,
        donationsResponse,
        prayerResponse,
        settingsResponse,
      ] = await Promise.allSettled([
        utilityService.getDashboardStats(), // ✅ now points to /api/analytics/admin/dashboard/stats
        utilityService.getRecentActivity(), // ✅ now points to /api/analytics/admin/activity/recent
        userService.getAllUsers({ limit: 100 }),
        adminService.getMinistries(),
        adminService.getTestimonials(),
        adminService.getBlogPosts(), // ✅ now points to /api/blogs/admin/all
        eventService.getAll({ limit: 50 }),
        sermonService.getAll({ limit: 50 }),
        donationService.getAll({ limit: 100 }),
        prayerService.getAll({ limit: 100 }),
        adminService.getSettings(),
      ]);

      // Process responses with proper error handling
      setStats(
        statsResponse.status === "fulfilled"
          ? statsResponse.value.data || statsResponse.value
          : {},
      );
      setRecentActivity(
        activityResponse.status === "fulfilled"
          ? Array.isArray(activityResponse.value.data)
            ? activityResponse.value.data
            : []
          : [],
      );
      setUsers(
        usersResponse.status === "fulfilled"
          ? Array.isArray(usersResponse.value.users)
            ? usersResponse.value.users
            : []
          : [],
      );
      setMinistries(
        ministriesResponse.status === "fulfilled"
          ? Array.isArray(ministriesResponse.value.ministries)
            ? ministriesResponse.value.ministries
            : []
          : [],
      );
      setTestimonials(
        testimonialsResponse.status === "fulfilled"
          ? Array.isArray(testimonialsResponse.value.testimonials)
            ? testimonialsResponse.value.testimonials
            : []
          : [],
      );
      setBlogPosts(
        blogResponse.status === "fulfilled"
          ? Array.isArray(blogResponse.value.posts)
            ? blogResponse.value.posts
            : []
          : [],
      );
      setUpcomingEvents(
        eventsResponse.status === "fulfilled"
          ? Array.isArray(eventsResponse.value.events)
            ? eventsResponse.value.events
            : []
          : [],
      );
      setSermons(
        sermonsResponse.status === "fulfilled"
          ? Array.isArray(sermonsResponse.value.sermons)
            ? sermonsResponse.value.sermons
            : []
          : [],
      );
      setDonations(
        donationsResponse.status === "fulfilled"
          ? Array.isArray(donationsResponse.value.donations)
            ? donationsResponse.value.donations
            : []
          : [],
      );
      setPrayerRequests(
        prayerResponse.status === "fulfilled"
          ? Array.isArray(prayerResponse.value.prayers)
            ? prayerResponse.value.prayers
            : []
          : [],
      );
      setSettings(
        settingsResponse.status === "fulfilled"
          ? settingsResponse.value.settings || settingsResponse.value.data || {}
          : {},
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to load dashboard data";
      setError(errorMessage);
      alert.error(errorMessage);
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
      console.error("Error fetching settings:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load settings";
      alert.error(errorMessage);
    }
  };

  const handleUpdateSettings = async (settingsData) => {
    try {
      const response = await adminService.updateSettings(settingsData);
      const updatedSettings = response.data?.settings || response.settings;

      if (updatedSettings) {
        setSettings(updatedSettings);
        return { success: true, message: "Settings updated successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update settings";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleResetSettings = async () => {
    try {
      const response = await adminService.resetSettings();
      setSettings(response.settings || response);
      alert.success("Settings reset successfully");
      return { success: true, message: "Settings reset successfully" };
    } catch (error) {
      console.error("Error resetting settings:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to reset settings";
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
      console.error("Error getting live stream status:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to get live stream status";
      alert.error(errorMessage);

      return { success: false, message: errorMessage };
    }
  };

  const handleStartLiveStream = async () => {
    try {
      const response = await sermonService.startLiveStream();
      setLiveStreamStatus(true);
      alert.success("Live stream started successfully");
      return { success: true, message: "Live stream started successfully" };
    } catch (error) {
      console.error("Error starting live stream:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to start live stream";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleStopLiveStream = async () => {
    try {
      const response = await sermonService.stopLiveStream();
      setLiveStreamStatus(false);
      setLiveStats(null);
      alert.success("Live stream ended successfully");
      return { success: true, message: "Live stream ended successfully" };
    } catch (error) {
      console.error("Error stopping live stream:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to stop live stream";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // User Management Handlers
  const handleCreateUser = async (userData) => {
    try {
      const response = await userService.createUser(userData);
      const newUser = response.data?.user || response.user;

      if (newUser) {
        setUsers((prev) => [...prev, newUser]);
        return { success: true, message: "User created successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create user";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      const response = await userService.updateUser(userId, userData);
      const updatedUser = response.data?.user || response.user;

      if (updatedUser) {
        setUsers((prev) =>
          prev.map((user) => (user._id === userId ? updatedUser : user)),
        );
        return { success: true, message: "User updated successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update user";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete user";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Ministry Management Handlers
  const handleCreateMinistry = async (ministryData) => {
    try {
      const response = await adminService.createMinistry(ministryData);
      const newMinistry = response.data?.ministry || response.ministry;

      if (newMinistry) {
        setMinistries((prev) => [...prev, newMinistry]);
        return { success: true, message: "Ministry created successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error creating ministry:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create ministry";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateMinistry = async (ministryId, ministryData) => {
    try {
      const response = await adminService.updateMinistry(
        ministryId,
        ministryData,
      );
      const updatedMinistry = response.data?.ministry || response.ministry;

      if (updatedMinistry) {
        setMinistries((prev) =>
          prev.map((ministry) =>
            ministry._id === ministryId ? updatedMinistry : ministry,
          ),
        );
        return { success: true, message: "Ministry updated successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating ministry:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update ministry";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteMinistry = async (ministryId) => {
    try {
      await adminService.deleteMinistry(ministryId);
      setMinistries((prev) =>
        prev.filter((ministry) => ministry._id !== ministryId),
      );
      return { success: true, message: "Ministry deleted successfully" };
    } catch (error) {
      console.error("Error deleting ministry:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete ministry";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Testimonial Management Handlers
  const handleCreateTestimonial = async (testimonialData) => {
    try {
      const response =
        await testimonialService.createTestimonial(testimonialData);
      setTestimonials((prev) => [
        ...prev,
        response.data?.testimonial || response.testimonial,
      ]);
      return { success: true, message: "Testimonial created successfully" };
    } catch (error) {
      console.error("Error creating testimonial:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create testimonial";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateTestimonial = async (testimonialId, testimonialData) => {
    try {
      const response = await testimonialService.updateTestimonial(
        testimonialId,
        testimonialData,
      );
      setTestimonials((prev) =>
        prev.map((testimonial) =>
          testimonial._id === testimonialId
            ? response.data?.testimonial || response.testimonial
            : testimonial,
        ),
      );
      return { success: true, message: "Testimonial updated successfully" };
    } catch (error) {
      console.error("Error updating testimonial:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update testimonial";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteTestimonial = async (testimonialId) => {
    try {
      await testimonialService.deleteTestimonial(testimonialId);
      setTestimonials((prev) =>
        prev.filter((testimonial) => testimonial._id !== testimonialId),
      );
      return { success: true, message: "Testimonial deleted successfully" };
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete testimonial";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Blog Management Handlers
  const handleCreateBlogPost = async (blogData) => {
    try {
      const response = await blogService.createBlogPost(blogData);
      setBlogPosts((prev) => [...prev, response.data?.post || response.post]);
      return { success: true, message: "Blog post created successfully" };
    } catch (error) {
      console.error("Error creating blog post:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create blog post";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateBlogPost = async (blogId, blogData) => {
    try {
      const response = await blogService.updateBlogPost(blogId, blogData);
      setBlogPosts((prev) =>
        prev.map((post) =>
          post._id === blogId ? response.data?.post || response.post : post,
        ),
      );
      return { success: true, message: "Blog post updated successfully" };
    } catch (error) {
      console.error("Error updating blog post:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update blog post";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteBlogPost = async (blogId) => {
    try {
      await blogService.deleteBlogPost(blogId);
      setBlogPosts((prev) => prev.filter((post) => post._id !== blogId));
      return { success: true, message: "Blog post deleted successfully" };
    } catch (error) {
      console.error("Error deleting blog post:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete blog post";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Event Management Handlers
  const handleCreateEvent = async (eventData) => {
    try {
      const response = await eventService.create(eventData);
      const newEvent = response.data?.event || response.event;

      if (newEvent) {
        setUpcomingEvents((prev) => [...prev, newEvent]);
        return { success: true, message: "Event created successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create event";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      const response = await eventService.update(eventId, eventData);
      const updatedEvent = response.data?.event || response.event;

      if (updatedEvent) {
        setUpcomingEvents((prev) =>
          prev.map((event) => (event._id === eventId ? updatedEvent : event)),
        );
        return { success: true, message: "Event updated successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update event";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await eventService.delete(eventId);
      setUpcomingEvents((prev) =>
        prev.filter((event) => event._id !== eventId),
      );
      return { success: true, message: "Event deleted successfully" };
    } catch (error) {
      console.error("Error deleting event:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete event";
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
        setSermons((prev) => [...prev, newSermon]);
        return { success: true, message: "Sermon created successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error creating sermon:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create sermon";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleUpdateSermon = async (sermonId, sermonData) => {
    try {
      const response = await sermonService.update(sermonId, sermonData);
      const updatedSermon = response.data?.sermon || response.sermon;

      if (updatedSermon) {
        setSermons((prev) =>
          prev.map((sermon) =>
            sermon._id === sermonId ? updatedSermon : sermon,
          ),
        );
        return { success: true, message: "Sermon updated successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating sermon:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update sermon";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeleteSermon = async (sermonId) => {
    try {
      await sermonService.delete(sermonId);
      setSermons((prev) => prev.filter((sermon) => sermon._id !== sermonId));
      return { success: true, message: "Sermon deleted successfully" };
    } catch (error) {
      console.error("Error deleting sermon:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete sermon";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Donation Management Handlers
  const handleUpdateDonation = async (donationId, donationData) => {
    try {
      const response = await donationService.updateDonation(
        donationId,
        donationData,
      );
      const updatedDonation = response.data?.donation || response.donation;

      if (updatedDonation) {
        setDonations((prev) =>
          prev.map((donation) =>
            donation._id === donationId ? updatedDonation : donation,
          ),
        );
        return { success: true, message: "Donation updated successfully" };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating donations:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update donations";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Prayer Request Management Handlers
  const handleUpdatePrayerRequest = async (prayerId, prayerData) => {
    try {
      const response = await prayerService.updatePrayerRequest(
        prayerId,
        prayerData,
      );
      const updatedPrayer = response.data?.prayer || response.prayer;

      if (updatedPrayer) {
        setPrayerRequests((prev) =>
          prev.map((prayer) =>
            prayer._id === prayerId ? updatedPrayer : prayer,
          ),
        );
        return {
          success: true,
          message: "Prayer request updated successfully",
        };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error updating prayer request:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update prayer request";
      alert.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const handleDeletePrayerRequest = async (prayerId) => {
    try {
      await prayerService.deletePrayerRequest(prayerId);
      setPrayerRequests((prev) =>
        prev.filter((prayer) => prayer._id !== prayerId),
      );
      return { success: true, message: "Prayer request deleted successfully" };
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete prayer request";
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
    setDeleteType("");
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      let result;
      switch (deleteType) {
        case "user":
          result = await handleDeleteUser(deleteItem._id);
          break;
        case "ministry":
          result = await handleDeleteMinistry(deleteItem._id);
          break;
        case "testimonial":
          result = await handleDeleteTestimonial(deleteItem._id);
          break;
        case "blog":
          result = await handleDeleteBlogPost(deleteItem._id);
          break;
        case "event":
          result = await handleDeleteEvent(deleteItem._id);
          break;
        case "sermon":
          result = await handleDeleteSermon(deleteItem._id);
          break;
        case "prayer":
          result = await handleDeletePrayerRequest(deleteItem._id);
          break;
        default:
          result = { success: false, message: "Unknown item type" };
      }

      if (result.success) {
        alert.success(result.message);
      } else {
        alert.error(result.message);
      }
    } catch (error) {
      alert.error("An error occurred during deletion");
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
      alert.error("An error occurred while saving the event");
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
      alert.error("An error occurred while saving the sermon");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to access the admin panel.
          </p>
          <button
            onClick={() => navigate("/login")}
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
    return (
      <Loader type="spinner" text="Loading admin dashboard..." fullScreen />
    );
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Admin privileges are required to access this page.
          </p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
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
              <i className="fas fa-exclamation-triangle text-red-500 text-2xl mb-3" />
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
    { label: "Overview", icon: "fas fa-tachometer-alt", tabName: "overview" },
    { label: "Users", icon: "fas fa-users", tabName: "users" },
    {
      label: "Ministries",
      icon: "fas fa-hands-helping",
      tabName: "ministries",
    },
    {
      label: "Testimonials",
      icon: "far fa-comment-dots",
      tabName: "testimonials",
    },
    { label: "Blog", icon: "far fa-newspaper", tabName: "blog" },
    { label: "Events", icon: "far fa-calendar-alt", tabName: "events" },
    { label: "Sermons", icon: "fas fa-microphone-alt", tabName: "sermons" },
    {
      label: "Donations",
      icon: "fas fa-hand-holding-usd",
      tabName: "donations",
    },
    {
      label: "Prayer Requests",
      icon: "fas fa-praying-hands",
      tabName: "prayer",
    },
    { label: "Live Stream", icon: "fas fa-broadcast-tower", tabName: "live" },
    { label: "Settings", icon: "fas fa-cog", tabName: "settings" },
  ];

  const eventColumns = [
    { key: "title", title: "Event" },
    {
      key: "date",
      title: "Date",
      render: (event) => formatDate(event.startTime),
    },
    {
      key: "time",
      title: "Time",
      render: (event) => formatTime(event.startTime),
    },
    { key: "location", title: "Location" },
    { key: "rsvps", title: "RSVPs", render: (event) => event.rsvpCount || 0 },
    {
      key: "status",
      title: "Status",
      render: (event) => (
        <span
          className={`text-xs px-2 py-1 rounded ${event.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
        >
          {event.status || "Unknown"}
        </span>
      ),
    },
  ];

  const sermonColumns = [
    { key: "title", title: "Title" },
    {
      key: "speaker",
      title: "Speaker",
      render: (sermon) => sermon.speakerName || sermon.speaker,
    },
    { key: "date", title: "Date", render: (sermon) => formatDate(sermon.date) },
    { key: "scripture", title: "Scripture" },
    {
      key: "type",
      title: "Type",
      render: (sermon) => (
        <span
          className={`text-xs px-2 py-1 rounded ${sermon.isLive ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
        >
          {sermon.isLive ? "Live" : "Recorded"}
        </span>
      ),
    },
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
                    {navItems.map((item) => (
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
              {activeTab === "overview" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-4">
                      Dashboard Overview
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Welcome to the admin dashboard. Here's a summary of your
                      church's activity.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                      title="Total Members"
                      value={stats.totalMembers || "0"}
                      change={stats.membersChange || "0% from last month"}
                      changeType={stats.membersChangeType || "increase"}
                      icon="fa-users"
                      iconBgColor="bg-blue-100"
                      iconTextColor="text-blue-500"
                    />
                    <StatCard
                      title="Weekly Attendance"
                      value={stats.weeklyAttendance || "0"}
                      change={stats.attendanceChange || "0% from last week"}
                      changeType={stats.attendanceChangeType || "increase"}
                      icon="fa-user-check"
                      iconBgColor="bg-green-100"
                      iconTextColor="text-green-500"
                    />
                    <StatCard
                      title="Online Viewers"
                      value={stats.onlineViewers || "0"}
                      change={stats.viewersChange || "0% from last week"}
                      changeType={stats.viewersChangeType || "increase"}
                      icon="fa-video"
                      iconBgColor="bg-purple-100"
                      iconTextColor="text-purple-500"
                    />
                    <StatCard
                      title="Weekly Giving"
                      value={
                        stats.weeklyGiving
                          ? `$${stats.weeklyGiving.toLocaleString()}`
                          : "$0"
                      }
                      change={stats.givingChange || "0% from last week"}
                      changeType={stats.givingChangeType || "increase"}
                      icon="fa-hand-holding-usd"
                      iconBgColor="bg-yellow-100"
                      iconTextColor="text-yellow-500"
                    />
                  </div>

                  {liveStreamStatus && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
                        <span className="font-medium text-red-700">
                          Live Stream is Active
                        </span>
                        <button
                          onClick={() => setActiveTab("live")}
                          className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Manage Live Stream{" "}
                          <i className="fas fa-arrow-right ml-1" />
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
                            icon={activity.icon || "fa-info-circle"}
                            bgColor={activity.bgColor || "bg-gray-100"}
                            text={activity.text || "Unknown activity"}
                            time={activity.time || "Unknown time"}
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
                          <i className="fas fa-praying-hands text-blue-500" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">
                        {stats.prayerRequests || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        Pending: {stats.pendingPrayers || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Events</h4>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <i className="far fa-calendar-alt text-green-500" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">
                        {stats.upcomingEvents || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        This week: {stats.thisWeekEvents || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Sermons</h4>
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-microphone-alt text-purple-500" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">
                        {stats.totalSermons || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        This month: {stats.monthSermons || 0}
                      </p>
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
                          <i className="fas fa-plus mr-1" /> Add Event
                        </button>
                      </div>
                      <DataTable
                        columns={eventColumns}
                        data={(upcomingEvents || []).slice(0, 5)}
                        onEdit={openEventModal}
                        onDelete={(event) => openDeleteModal(event, "event")}
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
                          <i className="fas fa-plus mr-1" /> Add Sermon
                        </button>
                      </div>
                      <DataTable
                        columns={sermonColumns}
                        data={(sermons || []).slice(0, 5)}
                        onEdit={openSermonModal}
                        onDelete={(sermon) => openDeleteModal(sermon, "sermon")}
                        emptyMessage="No sermons available"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <UsersManagement
                  users={users}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={(user) =>
                    openDeleteModal(user, "user", "moderator")
                  }
                  onCreateUser={handleCreateUser}
                />
              )}

              {activeTab === "ministries" && (
                <MinistriesManagement
                  ministries={ministries}
                  users={users}
                  onUpdateMinistry={handleUpdateMinistry}
                  onDeleteMinistry={(ministry) =>
                    openDeleteModal(ministry, "ministry")
                  }
                  onCreateMinistry={handleCreateMinistry}
                />
              )}

              {activeTab === "testimonials" && (
                <TestimonialsManagement
                  testimonials={testimonials}
                  onUpdateTestimonial={handleUpdateTestimonial}
                  onDeleteTestimonial={(testimonial) =>
                    openDeleteModal(testimonial, "testimonial")
                  }
                  onCreateTestimonial={handleCreateTestimonial}
                />
              )}

              {activeTab === "blog" && (
                <BlogManagement
                  posts={blogPosts}
                  onUpdatePost={handleUpdateBlogPost}
                  onDeletePost={(post) => openDeleteModal(post, "blog")}
                  onCreatePost={handleCreateBlogPost}
                />
              )}

              {activeTab === "events" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Events Management</h2>
                    <button
                      className="btn btn-primary"
                      onClick={() => openEventModal()}
                    >
                      <i className="fas fa-plus mr-2" /> Add New Event
                    </button>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <DataTable
                      columns={eventColumns}
                      data={upcomingEvents}
                      onEdit={openEventModal}
                      onDelete={(event) => openDeleteModal(event, "event")}
                      emptyMessage="No events available. Add your first event to get started."
                    />
                  </div>
                </div>
              )}

              {activeTab === "sermons" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Sermons Management</h2>
                    <button
                      className="btn btn-primary"
                      onClick={() => openSermonModal()}
                    >
                      <i className="fas fa-plus mr-2" /> Add New Sermon
                    </button>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <DataTable
                      columns={sermonColumns}
                      data={sermons}
                      onEdit={openSermonModal}
                      onDelete={(sermon) => openDeleteModal(sermon, "sermon")}
                      emptyMessage="No sermons available. Add your first sermon to get started."
                    />
                  </div>
                </div>
              )}

              {activeTab === "donations" && (
                <DonationsManagement
                  donations={donations}
                  onUpdateDonation={handleUpdateDonation}
                />
              )}

              {activeTab === "prayer" && (
                <PrayerRequestsManagement
                  prayerRequests={prayerRequests}
                  onUpdatePrayerRequest={handleUpdatePrayerRequest}
                  onDeletePrayerRequest={(prayer) =>
                    openDeleteModal(prayer, "prayer")
                  }
                />
              )}

              {activeTab === "live" && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      Live Stream Management
                    </h2>
                    <p className="text-gray-600">
                      Manage your church's live streaming services.
                    </p>
                  </div>

                  <LiveStreamControl
                    isLive={liveStreamStatus}
                    onStartLive={handleStartLiveStream}
                    onStopLive={handleStopLiveStream}
                    liveStats={liveStats}
                  />

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4">
                      Quick Sermon Creation
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create a sermon record for your live stream to make it
                      available in the archive later.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        openSermonModal({
                          isLive: true,
                          date: new Date().toISOString().split("T")[0],
                          title:
                            "Live Service - " + new Date().toLocaleDateString(),
                        })
                      }
                    >
                      <i className="fas fa-plus mr-2" /> Create Live Sermon
                      Record
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button>
                  {activeTab === "settings" && (
                    <SettingsForm
                      setActiveTab={isSettingsModalOpen}
                      settings={settings}
                      onUpdateSettings={handleUpdateSettings}
                      onResetSettings={handleResetSettings}
                    />
                  )}
                </button>
              </div>
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
