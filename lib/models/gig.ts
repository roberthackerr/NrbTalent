import mongoose from "mongoose"

const gigSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["development", "ai-ml", "cybersecurity", "telecom", "design", "marketing"],
    },
    subcategory: String,
    pricing: {
      basic: {
        title: String,
        description: String,
        price: Number,
        deliveryTime: Number,
        revisions: Number,
        features: [String],
      },
      standard: {
        title: String,
        description: String,
        price: Number,
        deliveryTime: Number,
        revisions: Number,
        features: [String],
      },
      premium: {
        title: String,
        description: String,
        price: Number,
        deliveryTime: Number,
        revisions: Number,
        features: [String],
      },
    },
    images: [String],
    tags: [String],
    requirements: [String],
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
    stats: {
      views: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      inQueue: { type: Number, default: 0 },
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

export const Gig = mongoose.models.Gig || mongoose.model("Gig", gigSchema)
