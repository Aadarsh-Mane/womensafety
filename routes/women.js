import express from "express";
import {
  addAlert,
  addComment,
  addPost,
  getComments,
  getLikes,
  getPosts,
  getUserPosts,
  toggleLike,
} from "../controllers/womenController.js";
import upload from "../helpers/multer.js";
import { auth } from "../middleware/auth.js";
import { Auth } from "googleapis";

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

womenRouter.post("/comment", auth, addComment);
womenRouter.post("/like", auth, toggleLike);
womenRouter.get("/:communityId/comments", getComments);
womenRouter.get("/:communityId/likes", getLikes);
womenRouter.post("/addAlert", auth, addAlert);

export default womenRouter;
