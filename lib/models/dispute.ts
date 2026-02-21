import mongoose from "mongoose"

const disputeSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ["quality_issues", "missed_deadline", "payment_issue", "scope_change", "communication_issue", "other"],
    },
    description: {
      type: String,
      required: true,
    },
    evidence: [
      {
        type: String,
        url: String,
        description: String,
      },
    ],
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed"],
      default: "open",
    },
    resolution: {
      decision: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
      refundAmount: Number,
      notes: String,
    },
    messages: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
)

export const Dispute = mongoose.models.Dispute || mongoose.model("Dispute", disputeSchema)
