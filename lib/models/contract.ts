import mongoose from "mongoose"

const contractSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    description: String,
    scope: String,
    deliverables: [String],
    timeline: {
      startDate: Date,
      endDate: Date,
    },
    payment: {
      amount: Number,
      currency: { type: String, default: "USD" },
      schedule: String,
      milestones: [
        {
          title: String,
          amount: Number,
          dueDate: Date,
          status: {
            type: String,
            enum: ["pending", "completed", "paid"],
            default: "pending",
          },
        },
      ],
    },
    terms: [String],
    signatures: {
      client: {
        signed: { type: Boolean, default: false },
        signedAt: Date,
        ipAddress: String,
      },
      freelancer: {
        signed: { type: Boolean, default: false },
        signedAt: Date,
        ipAddress: String,
      },
    },
    status: {
      type: String,
      enum: ["draft", "pending", "active", "completed", "terminated"],
      default: "draft",
    },
  },
  { timestamps: true },
)

export const Contract = mongoose.models.Contract || mongoose.model("Contract", contractSchema)
