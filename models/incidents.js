import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    incidentId: { type: Number, unique: true },
    type: { type: String, required: true },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedByName: { type: String, required: true }, // Save the user's name
    location: { type: String, required: true },
    time: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Active", "Pending", "Resolved"],
      default: "Open",
    },
    priority: { type: String, enum: ["Low", "Medium", "High"], required: true },
  },
  { timestamps: true }
);
incidentSchema.pre("save", async function (next) {
  if (!this.incidentId) {
    const lastIncident = await mongoose
      .model("Incident")
      .findOne()
      .sort("-incidentId");
    this.incidentId = lastIncident ? lastIncident.incidentId + 1 : 1001;
  }

  next();
});

const Incident = mongoose.model("Incident", incidentSchema);
export default Incident;
