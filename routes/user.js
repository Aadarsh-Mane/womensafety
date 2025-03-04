import express from "express";
import {
  completeSignup,
  createGoal,
  depositToGoal,
  getGoals,
  getUserProfile,
  initiateSignup,
  sendWelcomeMessage,
  setPin,
  signin,
  updateUserProfile,
  verifyOtp,
} from "../controllers/user.js";
import { auth } from "../middleware/auth.js";
import upload from "../helpers/multer.js";
const userRouter = express.Router();

//userRouter.post("/signup", signup);
// userRouter.post("/api/v1/createOrder", createOrder);
userRouter.post(
  "/initiateSignup",

  initiateSignup
);
userRouter.post(
  "/verifyOtp",

  verifyOtp
);
userRouter.post(
  "/set-pin",

  setPin
);
userRouter.post(
  "/completeSignup",

  completeSignup
);
userRouter.post(
  "/signin",

  signin
);
userRouter.patch(
  "/updateUserProfile",
  auth,
  upload.single("itemImage"),

  updateUserProfile
);
userRouter.get(
  "/getUserProfile",
  auth,

  getUserProfile
);
userRouter.post(
  "/createGoal",
  auth,

  createGoal
);
userRouter.post(
  "/depositToGoal",
  auth,

  depositToGoal
);
userRouter.get(
  "/getGoals",
  auth,

  getGoals
);
userRouter.post(
  "/sendWelcomeMessage",

  sendWelcomeMessage
);

export default userRouter;
