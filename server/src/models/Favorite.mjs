// models/Favorite.js
import { Schema, model } from "mongoose";

const favoriteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      enum: ["sermon", "event", "blog", "ministry"],
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
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

export default model("Favorite", favoriteSchema);
