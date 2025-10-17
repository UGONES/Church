// models/BlogPost.js
import { Schema, model } from 'mongoose';

const blogPostSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['announcements', 'devotional', 'testimony', 'teaching', 'news', 'events'],
    default: 'announcements'
  },
  imageUrl: String,
  readTime: {
    type: Number,
    default: 5
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  }],
  seoTitle: String,
  seoDescription: String,
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  readTime: {
    type: String,
    default: "5 min read"
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
}, {
  timestamps: true
});

// Indexes
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ createdAt: -1 });
blogPostSchema.index({ slug: 1 });

// Generate slug before saving
blogPostSchema.pre('save', function (next) {
  if (this.isModified('title') && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

export default model('BlogPost', blogPostSchema);