// models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    category: {
      type: String,
      enum: [
        "service",
        "bible-study",
        "prayer",
        "youth",
        "children",
        "men",
        "women",
        "fellowship",
        "outreach",
        "training",
      ],
      default: "service",
    },
    imageUrl: String,
    capacity: {
      type: Number,
      default: 0,
    },
    registered: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "cancelled", "completed"],
      default: "draft",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: Number,
      endDate: Date,
    },
    requiresRSVP: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
    },
    leaders: [
      {
        name: String,
        role: String,
      },
    ],
    tags: [String],
  },
  {
    timestamps: true,
  },
);

// Indexes
eventSchema.index({ startTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ requiresRSVP: 1 });

module.exports = mongoose.model("Event", eventSchema);
