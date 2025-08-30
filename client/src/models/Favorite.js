// models/Favorite.js
export class Favorite {
  constructor(data = {}) {
    this._id = data._id || null;
    this.userId = data.userId || null;
    this.itemType = data.itemType || ''; // 'sermon', 'event', 'blog', 'ministry'
    this.itemId = data.itemId || null;
    this.createdAt = data.createdAt || new Date();
  }
}