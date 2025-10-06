// models/Volunteer.js
import { Schema, model } from "mongoose";

const volunteerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ministryId: {
      type: Schema.Types.ObjectId,
      ref: "Ministry",
      required: true,
    },
    interests: [String],
    availability: {
      days: [
        {
          type: String,
          enum: [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ],
        },
      ],
      times: [
        {
          type: String,
          enum: ["morning", "afternoon", "evening"],
        },
      ],
    },
    skills: [String],
    experience: String,
    message: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "inactive"],
      default: "pending",
    },
    startDate: Date,
    endDate: Date,
    hoursVolunteered: {
      type: Number,
      default: 0,
    },
    trainingCompleted: [
      {
        name: String,
        completedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
volunteerSchema.index({ userId: 1, ministryId: 1 }, { unique: true });
volunteerSchema.index({ ministryId: 1 });
volunteerSchema.index({ status: 1 });

export default model("Volunteer", volunteerSchema);
