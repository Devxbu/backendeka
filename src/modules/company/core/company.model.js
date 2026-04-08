const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    authId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    employees: {
      type: String,
      required: true,
    },
    foundingYear: {
      type: Number,
      required: true,
    },
    languages: {
      type: Array,
      required: true,
    },
    tools: {
      type: Array,
      required: true,
    },
    industry: {
      type: Array,
      required: true,
    },
    workingPreference: {
      type: [String],
      enum: ["remote", "hybrid", "onsite", "freelance"],
      default: "remote",
    },
    bio: {
      type: String,
      required: true,
    },
    pfp: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    areas: [
      {
        category: {
          type: String,
          required: true,
        },
        subCategory: {
          type: String,
          required: true,
        },
      },
    ],
    socials: [
      {
        name: { type: String, required: true },
        link: { type: String, required: true },
      },
    ],
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    taxNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    isTaxVerified: {
      type: Boolean,
      default: false,
    },
    savedStudios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      },
    ],
    savedContents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
      },
    ],
    likedContents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Content",
      },
    ],
  },
  { timestamps: true },
);

companySchema.index({ name: "text", bio: "text" });

module.exports = mongoose.model("Company", companySchema);
