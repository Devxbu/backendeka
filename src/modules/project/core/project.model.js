const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedDate: {
      type: Date,
    },
    categories: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    finalPrice: {
      type: Number,
    },
    snoozedEndDate: {
      type: Date,
    },
    tools: {
      type: Array,
      default: [],
    },
    budget: {
      min: { type: Number },
      max: { type: Number },
    },
    language: {
      type: Array,
      default: [],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    progress: {
      type: String,
      enum: ["in_progress", "completed", "cancelled", "requested"],
      default: "requested",
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

projectSchema.index({ userId: 1, progress: 1, createdAt: -1 });
projectSchema.index({ partnerId: 1, progress: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
