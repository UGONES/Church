// models/Favorite.js
import { Schema, model } from 'mongoose';

const favoriteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // PascalCase model names stored here (Event, Sermon, BlogPost, Ministry)
  itemType: {
    type: String,
    enum: ['Sermon', 'Event', 'BlogPost', 'Ministry'],
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    // use refPath so Mongoose will look up the model named in `itemType`
    refPath: 'itemType'
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only favorite an item once
favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

// Index for querying by item
favoriteSchema.index({ itemType: 1, itemId: 1 });

export default model('Favorite', favoriteSchema);
