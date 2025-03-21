import mongoose from "mongoose";

const emergencyServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["police", "hospital"], required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: { type: String },
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
    },
    verified: { type: Boolean, default: false },
    lastVerified: { type: Date },
  },
  { timestamps: true }
);

// Create a geospatial index for efficient querying
emergencyServiceSchema.index({ location: "2dsphere" });

const EmergencyService = mongoose.model(
  "EmergencyService",
  emergencyServiceSchema
);
export default EmergencyService;
