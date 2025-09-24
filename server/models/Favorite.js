// models/Favorite.js
const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["sermon", "event", "blog", "ministry"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemType",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure a user can only favorite an item once
favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true });

// Index for querying by item
favoriteSchema.index({ itemType: 1, itemId: 1 });

module.exports = mongoose.model("Favorite", favoriteSchema);
