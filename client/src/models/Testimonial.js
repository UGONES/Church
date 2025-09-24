// models/Testimonial.js
export class Testimonial {
  constructor(data = {}) {
    this._id = data._id || null;
    this.name = data.name || "";
    this.email = data.email || "";
    this.content = data.content || "";
    this.imageUrl = data.imageUrl || "";
    this.relationship = data.relationship || "";
    this.allowSharing = data.allowSharing || false;
    this.status = data.status || "pending";
    this.category = data.category || "general";
    this.date = data.date || new Date();
  }
}
