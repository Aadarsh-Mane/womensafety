import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    dob: { type: Date },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobileNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pin: { type: String },
    otp: {
      code: String,
      expiresAt: Date,
    },
    isOtpVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
