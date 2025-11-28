import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Message Schema
 * Supports both public and private chat messages
 * Includes optional linking to users, admins, and sermons
 */

const MessageSchema = new Schema(
  {
    // message content
    text: {
      type: String,
      required: true,
      trim: true,
    },

    // message type: "public" or "private"
    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    // user who sent it
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // user (admin/moderator) who receives private messages
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // optional name/email snapshot for display
    userName: {
      type: String,
      default: "Guest",
    },
    userEmail: {
      type: String,
      default: "",
    },

    // optional: related sermon (if chat occurs in sermon page)
    sermonId: {
      type: Schema.Types.ObjectId,
      ref: "Sermon",
      default: null,
    },

    // timestamps
    sentAt: {
      type: Date,
      default: Date.now,
    },

    // message delivery or visibility flags
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient chat retrieval
MessageSchema.index({ sermonId: 1, type: 1, sentAt: -1 });
MessageSchema.index({ userId: 1, sentAt: -1 });

export default model("Message", MessageSchema);
