import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "finance",
        "education",
        "retirement",
        "travel",
        "wedding",
        "custom",
      ],
      required: true,
    },
    customCategory: { type: String, trim: true }, // for custom goals
    targetAmount: { type: Number, required: true },
    initialSaving: { type: Number, default: 0 },
    currentAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true }, // New field
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
