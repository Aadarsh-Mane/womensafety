import { Readable } from "stream";
import Community from "../models/community.js";
import cloudinary from "../helpers/cloudinary.js";

export const addPost = async (req, res) => {
  // router.post('/add-community', upload.single('image'), async (req, res) => {
  try {
    const { title, description, location } = req.body;
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
