import mongoose from "mongoose";
const communitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    image: { type: String }, // Store image URL (e.g., Cloudinary link)
    description: { type: String },
    location: { type: String },
  },
  { timestamps: true }
);
const Community = mongoose.model("Community", communitySchema);
export default Community;
