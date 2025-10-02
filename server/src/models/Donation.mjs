// models/Donation.js
import { Schema, model } from "mongoose";

const donationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["one-time", "weekly", "monthly", "quarterly", "yearly"],
      default: "one-time",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank", "paypal", "cash", "other"],
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      unique: true,
    },
    stripeCustomerId: String,
    donorName: {
      type: String,
      required: true,
    },
    donorEmail: {
      type: String,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    dedication: {
      type: String,
      default: "",
    },
    receiptSent: {
      type: Boolean,
      default: false,
    },
    receiptSentAt: Date,
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundReason: String,
  },
  {
    timestamps: true,
  },
);

// Indexes
donationSchema.index({ userId: 1, createdAt: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });
donationSchema.index({ createdAt: 1 });
donationSchema.index({ donorEmail: 1 });

export default model("Donation", donationSchema);
