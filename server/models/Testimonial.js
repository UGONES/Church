// models/Testimonial.js
const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: String,
    relationship: {
      type: String,
      enum: ["member", "visitor", "volunteer", "staff", "other"],
      default: "member",
    },
    yearsInChurch: Number,
    allowSharing: {
      type: Boolean,
      default: false,
    },
    allowContact: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "featured"],
      default: "pending",
    },
    category: {
      type: String,
      enum: ["salvation", "healing", "provision", "relationship", "other"],
      default: "other",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    isVideo: {
      type: Boolean,
      default: false,
    },
    videoUrl: String,
    featuredAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes
testimonialSchema.index({ status: 1 });
testimonialSchema.index({ category: 1 });
testimonialSchema.index({ createdAt: -1 });
testimonialSchema.index({ rating: -1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);
