// models/Donation.js
export class Donation {
  constructor(data = {}) {
    this._id = data._id || null;
    this.userId = data.userId || null;
    this.amount = data.amount || 0;
    this.currency = data.currency || "USD";
    this.frequency = data.frequency || "one-time";
    this.status = data.status || "pending";
    this.stripePaymentIntentId = data.stripePaymentIntentId || null;
    this.donorName = data.donorName || "";
    this.donorEmail = data.donorEmail || "";
    this.date = data.date || new Date();
    this.receiptSent = data.receiptSent || false;
  }
}
