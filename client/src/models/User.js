class User {
  constructor(data = {}) {
    this._id = data._id || null;
    this.id = data.id || data._id || null;
    this.email = data.email || "";
    this.name = data.name || "";
    this.firstName = data.firstName || "";
    this.lastName = data.lastName || "";
    ((this.role = data.role || "user"), "admin", "moderator");
    this.isLoggedIn = data.isLoggedIn || false;
    this.emailVerified = data.emailVerified || false;
    this.profileImage = data.profileImage || data.avatar || null;
    this.familyMembers = data.familyMembers || [];
    this.communicationPreferences = data.communicationPreferences || {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: true,
      eventReminders: true,
      prayerUpdates: true,
    };
    this.memberSince = data.memberSince || new Date();
    this.membershipStatus = data.membershipStatus || "active";
    this.smallGroup = data.smallGroup || "";
    this.volunteerStats = data.volunteerStats || {
      totalHours: 0,
      completedTrainings: [],
      activeApplications: 0,
    };
    this.createdAt = data.createdAt || new Date();
    this.isActive = data.isActive !== false;
    this.authMethod = data.authMethod || "local";

    Object.assign(this, data);
  }

  get fullName() {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.name;
  }

  get isAdmin() {
    return this.role === "admin";
  }

  get isModerator() {
    return this.role === "moderator" || this.role === "admin";
  }

  get isUser() {
    return this.role === "user";
  }

  get isAuthenticated() {
    return !!this.id && this.isLoggedIn;
  }
}

export default User;
