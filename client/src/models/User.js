// models/User.js
export class User {
  constructor(data = {}) {
    this._id = data._id || null;
    this.email = data.email || "";
    this.name = data.name || "";
    this.role = data.role || "user";
    this.isLoggedIn = data.isLoggedIn || false;
    this.emailVerified = data.emailVerified || false;
    this.profileImage = data.profileImage || null;
    this.familyMembers = data.familyMembers || [];
    this.communicationPreferences = data.communicationPreferences || {};
    this.createdAt = data.createdAt || new Date();
  }
}
