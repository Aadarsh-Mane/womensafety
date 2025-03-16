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
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    likes: { type: Number, default: 0 }, // Like counter
    likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track users who liked
  },
  { timestamps: true }
);

const Community = mongoose.model("Community", communitySchema);
export default Community;
