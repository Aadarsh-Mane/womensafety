import mongoose from "mongoose";

const factorSchema = new mongoose.Schema({
  crime_rate: { type: String, required: true },
  visibility: { type: String, required: true },
  road_busyness: { type: String, required: true },
  police_presence: { type: String, required: true },
  lighting: { type: String, required: true },
  recent_crimes: { type: String, required: true },
  disturbances: { type: String, required: true },
});

const timeSlotSchema = new mongoose.Schema({
  safety_score: { type: Number, required: true },
  factors: { type: factorSchema, required: true },
});

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    time_slot_data: {
      "12-3_am": { type: timeSlotSchema, required: true },
      "3-6_am": { type: timeSlotSchema, required: true },
      "6-9_am": { type: timeSlotSchema, required: true },
      "9-12_am": { type: timeSlotSchema, required: true },
      "12-3_pm": { type: timeSlotSchema, required: true },
      "3-6_pm": { type: timeSlotSchema, required: true },
      "6-9_pm": { type: timeSlotSchema, required: true },
      "9-12_pm": { type: timeSlotSchema, required: true },
    },
  },
  { timestamps: true }
);

const Location = mongoose.model("Location", locationSchema);

export default Location;
