// models/BlogPost.js
export class BlogPost {
  constructor(data = {}) {
    this._id = data._id || null;
    this.title = data.title || '';
    this.excerpt = data.excerpt || '';
    this.content = data.content || '';
    this.category = data.category || 'announcements';
    this.author = data.author || '';
    this.imageUrl = data.imageUrl || '';
    this.date = data.date || new Date();
    this.readTime = data.readTime || '5 min read';
    this.tags = data.tags || [];
    this.status = data.status || 'published';
    this.views = data.views || 0;
  }
}