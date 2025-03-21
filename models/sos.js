import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      accuracy: { type: Number }, // location accuracy in meters, if available
    },
    emergencyType: { type: String, default: "general" },
    status: {
      type: String,
      enum: [
        "initiated",
        "processing",
        "contacted_services",
        "resolved",
        "failed",
      ],
      default: "initiated",
    },
    contactsNotified: [
      {
        contactId: String,
        contactType: { type: String, enum: ["personal", "emergency_service"] },
        name: String,
        phoneNumber: String,
        notificationStatus: {
          type: String,
          enum: ["sent", "failed", "pending"],
        },
        timestamp: Date,
      },
    ],
    audioFile: { type: String }, // Path to audio recording if any
    notes: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const SosAlert = mongoose.model("SosAlert", sosAlertSchema);
export default SosAlert;
