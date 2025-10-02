// models/Testimonial.js
export class Testimonial {
  constructor(data) {
    this.id = data._id || data.id;
    this.name = data.name;
    this.email = data.email;
    this.content = data.content;
    this.imageUrl = data.imageUrl;
    this.relationship = data.relationship;
    this.yearsInChurch = data.yearsInChurch;
    this.allowSharing = data.allowSharing;
    this.allowContact = data.allowContact;
    this.status = data.status;
    this.category = data.category;
    this.rating = data.rating;
    this.isVideo = data.isVideo;
    this.videoUrl = data.videoUrl;
    this.featuredAt = data.featuredAt;
    this.createdAt = data.createdAt;
  }
}
