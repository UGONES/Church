// models/Ministry.js
export class Ministry {
  constructor(data = {}) {
    this._id = data._id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.icon = data.icon || 'users';
    this.imageUrl = data.imageUrl || '';
    this.leaders = data.leaders || [];
    this.programs = data.programs || [];
    this.volunteerNeeds = data.volunteerNeeds || [];
    this.contactEmail = data.contactEmail || '';
    this.status = data.status || 'active';
  }
}