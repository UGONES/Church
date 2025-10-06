// models/Sermon.js
export class Sermon {
  constructor(data = {}) {
    this._id = data._id || null;
    this.title = data.title || "";
    this.speaker = data.speaker || "";
    this.description = data.description || "";
    this.category = data.category || "faith";
    this.videoUrl = data.videoUrl || "";
    this.imageUrl = data.imageUrl || "";
    this.date = data.date || new Date();
    this.duration = data.duration || "00:00";
    this.views = data.views || 0;
    this.likes = data.likes || 0;
    this.status = data.status || "published";
  }
}
