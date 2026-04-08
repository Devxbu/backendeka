const mongoose = require("mongoose");

// 3. Contact Message Schema
const contactMessageSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const communitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["events", "contest", "rfp"],
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
  },
  budget: {
    type: String,
  },
  description: {
    type: String,
  },
  location: {
    type: String,
  },
  date: {
    type: Date,
  },
  link: {
    type: String,
    required: true,
  },
});

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
const Community = mongoose.model("Community", communitySchema);
const FaqModel = mongoose.model("Faq", faqSchema);

module.exports = {
  ContactMessage,
  Community,
  FaqModel,
};
