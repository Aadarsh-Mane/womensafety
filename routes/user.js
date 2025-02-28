import express from "express";
import {
  completeSignup,
  initiateSignup,
  setPin,
  signin,
  verifyOtp,
} from "../controllers/user.js";

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

export default userRouter;
