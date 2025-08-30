// models/PrayerRequest.js
export class PrayerRequest {
  constructor(data = {}) {
    this._id = data._id || null;
    this.userId = data.userId || null;
    this.request = data.request || '';
    this.isPrivate = data.isPrivate || false;
    this.name = data.name || 'Anonymous';
    this.email = data.email || '';
    this.prayerCount = data.prayerCount || 0;
    this.userPrayed = data.userPrayed || false;
    this.notifyOnPray = data.notifyOnPray || false;
    this.status = data.status || 'pending';
    this.date = data.date || new Date();
  }
}