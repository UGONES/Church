// models/Sermon.js
const mongoose = require("mongoose");

const sermonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    speaker: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    scripture: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "sunday-service",
        "bible-study",
        "prayer-meeting",
        "youth",
        "special",
        "faith",
        "hope",
        "love",
      ],
      default: "sunday-service",
    },
    videoUrl: String,
    audioUrl: String,
    imageUrl: String,
    duration: {
      type: String,
      default: "00:00",
    },
    date: {
      type: Date,
      required: true,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    liveStreamUrl: String,
    liveStreamStatus: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
    },
    viewers: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    tags: [String],
    series: String,
    seriesPart: Number,
  },
  {
    timestamps: true,
  },
);

// Indexes
sermonSchema.index({ date: -1 });
sermonSchema.index({ category: 1 });
sermonSchema.index({ isLive: 1 });
sermonSchema.index({ status: 1 });
sermonSchema.index({ speaker: 1 });

module.exports = mongoose.model("Sermon", sermonSchema);
