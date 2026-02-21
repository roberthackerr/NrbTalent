import mongoose from "mongoose"

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ["project", "freelancer", "gig"],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true },
)

favoriteSchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: true })

export const Favorite = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema)
