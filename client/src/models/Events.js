// models/Event.js
export class Event {
  constructor(data = {}) {
    this._id = data._id || null;
    this.title = data.title || "";
    this.description = data.description || "";
    this.startTime = data.startTime || new Date();
    this.endTime = data.endTime || new Date();
    this.location = data.location || "";
    this.category = data.category || "service";
    this.imageUrl = data.imageUrl || "";
    this.capacity = data.capacity || 0;
    this.registered = data.registered || 0;
    this.status = data.status || "scheduled";
  }
}
