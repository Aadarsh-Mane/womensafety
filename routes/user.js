import express from "express";
import {
  addContact,
  completeSignup,
  createGoal,
  createIncident,
  depositToGoal,
  getAllUsers,
  getGoals,
  getMyIncident,
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
  "/addContact",
  auth,

  addContact
);
userRouter.post(
  "/createIncident",
  auth,
  upload.fields([
    { name: "incidentImage", maxCount: 1 },
    { name: "incidentAudio", maxCount: 1 },
  ]),
  createIncident
);

userRouter.get("/getAllUsers", getAllUsers);
userRouter.post("/sendWelcomeMessage", auth, sendWelcomeMessage);
userRouter.get("/getMyIncident", auth, getMyIncident);

export default userRouter;
