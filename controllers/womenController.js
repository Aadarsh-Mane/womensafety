import { Readable } from "stream";
import Community from "../models/community.js";
import cloudinary from "../helpers/cloudinary.js";
import User from "../models/users.js";
import Alert from "../models/alerts.js";

export const addPost = async (req, res) => {
  try {
    const { title, description, location, tags } = req.body; // Extract tags
    console.log(req.body);
    const userId = req.userId; // Extract userId from req.userId
    console.log("userId", userId);
    const itemImage = req.file;
    let imageUrl = "";

    if (itemImage) {
      const bufferStream = new Readable();
      bufferStream.push(itemImage.buffer);
      bufferStream.push(null);

      imageUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: "community_images" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        bufferStream.pipe(uploadStream);
      });
    }

    const newCommunity = new Community({
      userId,
      title,
      image: imageUrl,
      description,
      location,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [], // Ensure tags are an array
    });

    await newCommunity.save();
    res.status(201).json({
      message: "Community post created successfully",
      data: newCommunity,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Community.find().sort({ createdAt: -1 });

    res.status(200).json({ data: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from req.userId
    const userPosts = await Community.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ data: userPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId, text } = req.body;
    console.log(userId);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const communityPost = await Community.findById(communityId);
    if (!communityPost)
      return res.status(404).json({ message: "Post not found" });

    const comment = { userId, userName: user.name, text };
    communityPost.comments.push(comment);
    await communityPost.save();

    res.status(200).json({ message: "Comment added", comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like/Unlike Post
export const toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { communityId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const communityPost = await Community.findById(communityId);
    if (!communityPost)
      return res.status(404).json({ message: "Post not found" });

    const hasLiked = communityPost.likedUsers.includes(userId);

    if (hasLiked) {
      // Unlike the post
      communityPost.likes -= 1;
      communityPost.likedUsers = communityPost.likedUsers.filter(
        (id) => id.toString() !== userId
      );
    } else {
      // Like the post
      communityPost.likes += 1;
      communityPost.likedUsers.push(userId);
    }

    await communityPost.save();
    res.status(200).json({
      message: hasLiked ? "Like removed" : "Post liked",
      likes: communityPost.likes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Comments
export const getComments = async (req, res) => {
  try {
    const { communityId } = req.params;
    const communityPost = await Community.findById(communityId).select(
      "comments"
    );
    if (!communityPost)
      return res.status(404).json({ message: "Post not found" });

    res.status(200).json(communityPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Likes
export const getLikes = async (req, res) => {
  try {
    const { communityId } = req.params;
    const communityPost = await Community.findById(communityId).select("likes");
    if (!communityPost)
      return res.status(404).json({ message: "Post not found" });

    res.status(200).json(communityPost.likes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const addAlert = async (req, res) => {
  try {
    const { type, location, battery, deviceName } = req.body;
    const userId = req.userId; // Assuming authentication middleware provides userId

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const alertedBy = await User.findById(userId);
    if (!alertedBy) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert to IST with the preferred logic
    const dateTimeIST = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const newAlert = new Alert({
      alertedBy: alertedBy.name, // Assuming the user has a "name" field
      userId,
      type,
      location,
      battery,
      deviceName,
      dateTime: dateTimeIST, // Storing as formatted IST string
    });

    await newAlert.save();
    res
      .status(201)
      .json({ message: "Alert added successfully", alert: newAlert });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
