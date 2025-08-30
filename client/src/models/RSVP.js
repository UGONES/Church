// models/RSVP.js
export class RSVP {
  constructor(data = {}) {
    this._id = data._id || null;
    this.userId = data.userId || null;
    this.eventId = data.eventId || null;
    this.status = data.status || 'confirmed';
    this.guests = data.guests || 1;
    this.dietaryRestrictions = data.dietaryRestrictions || '';
    this.createdAt = data.createdAt || new Date();
  }
}