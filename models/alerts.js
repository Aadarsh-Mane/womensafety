import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alertedBy: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: ["SOS Alert", "Fall Detection Alert", "Panic Button Alert"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Responding", "Resolved"],
      default: "Active",
    },
    dateTime: {
      type: String,
    },
    location: {
      type: String,
    },
    deviceName: {
      type: String,
      required: true,
      trim: true,
    },
    battery: {
      type: String,
    },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);
export default Alert;
