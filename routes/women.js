import express from "express";
import {
  addPost,
  getPosts,
  getUserPosts,
} from "../controllers/womenController.js";
import upload from "../helpers/multer.js";
import { auth } from "../middleware/auth.js";

const womenRouter = express.Router();

//womenRouter.post("/signup", signup);
// womenRouter.post("/api/v1/createOrder", createOrder);
// router.post('/add-community', upload.single('image'), async (req, res) => {

womenRouter.post(
  "/addPost",
  auth,

  upload.single("image"),
  addPost
);
womenRouter.get(
  "/getMyPosts",
  auth,

  getUserPosts
);
womenRouter.get(
  "/getPosts",

  getPosts
);

export default womenRouter;
