const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    showFeed: {
      type: Boolean,
      default: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "case_study",
        "studio_content",
        "collaboration",
        "project_opportunity",
      ],
      required: true,
      index: true,
    },
    studioContentType: {
      type: String,
      enum: ["article", "videos", "podcast"],
    },
    links: {
      type: [
        {
          name: String,
          url: String,
        },
      ],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
    },
    saves: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    opportunity: {
      category: {
        type: String,
        trim: true,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      budget: {
        min: { type: Number },
        max: { type: Number },
      },
      tools: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Tool",
        default: [],
      },
      language: {
        type: [String],
        default: [],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index for efficient feed retrieval
contentSchema.index({ type: 1, showFeed: 1, isActive: 1, createdAt: -1 });
contentSchema.index({ companyId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Content", contentSchema);
