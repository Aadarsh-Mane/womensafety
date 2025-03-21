import mongoose from "mongoose";
const { Schema } = mongoose;

const SoSEmergency = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deviceInfo: {
    deviceName: {
      type: String,
      default: "Unknown",
    },
    battery: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  url: {
    type: String,
    required: true,
  },
  recipients: [
    {
      phoneNumber: {
        type: String,
        required: true,
      },
      formattedNumber: {
        type: String,
      },
      status: {
        type: String,
        enum: ["sent", "failed"],
        required: true,
      },
      messageId: {
        type: String,
      },
      error: {
        type: String,
      },
      responseData: {
        type: Object,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SosEmergency = mongoose.model("Sosemergency", SoSEmergency);
export default SosEmergency;
