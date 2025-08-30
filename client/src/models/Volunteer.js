// models/Volunteer.js
export class Volunteer {
  constructor(data = {}) {
    this._id = data._id || null;
    this.userId = data.userId || null;
    this.ministryId = data.ministryId || null;
    this.interests = data.interests || [];
    this.availability = data.availability || [];
    this.experience = data.experience || '';
    this.message = data.message || '';
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date();
  }
}