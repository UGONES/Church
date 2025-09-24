// models/Setting.js
const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    churchName: {
      type: String,
      required: true,
      default: "Our Church",
    },
    churchAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    contactEmail: String,
    contactPhone: String,
    pastorName: String,
    serviceTimes: [
      {
        day: String,
        time: String,
        description: String,
      },
    ],
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      youtube: String,
    },
    liveStreamUrl: String,
    givingOptions: {
      enableOnlineGiving: {
        type: Boolean,
        default: false,
      },
      stripePublishableKey: String,
      stripeSecretKey: String,
    },
    emailSettings: {
      host: String,
      port: Number,
      secure: Boolean,
      auth: {
        user: String,
        pass: String,
      },
    },
    sermonSettings: {
      defaultCategory: String,
      autoPublish: {
        type: Boolean,
        default: false,
      },
    },
    eventSettings: {
      requireApproval: {
        type: Boolean,
        default: false,
      },
      allowPublicRSVP: {
        type: Boolean,
        default: true,
      },
    },
    prayerRequestSettings: {
      requireApproval: {
        type: Boolean,
        default: true,
      },
      allowAnonymous: {
        type: Boolean,
        default: true,
      },
    },
    testimonialSettings: {
      requireApproval: {
        type: Boolean,
        default: true,
      },
      allowVideo: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Setting", settingSchema);
