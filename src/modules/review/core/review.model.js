const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["testimonial", "review"],
      required: true,
    },
    publicComment: {
      type: String,
      trim: true,
    },
    privateComment: {
      type: String,
      trim: true,
    },
    rating: {
      clear: { type: Number, min: 0, max: 5 },
      time: { type: Number, min: 0, max: 5 },
      commitments: { type: Number, min: 0, max: 5 },
      team: { type: Number, min: 0, max: 5 },
    },
    isVisible: {
      type: Boolean,
      default: false,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  },
);

// Compound index for profile reviews display
reviewSchema.index({ reviewedUserId: 1, isVisible: 1, createdAt: -1 });
// Ensure one review per project
reviewSchema.index({ projectId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
