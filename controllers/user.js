import axios from "axios";
import bcrypt from "bcrypt";
import User from "../models/users.js";
import jwt from "jsonwebtoken";
const JWT_SECRET = "vithuSafety";
const FAST2SMS_API_KEY =
  "WdZ9ew6msGSY2anqctkj437lUgC5b1oKIzf0p8DxrPTABJMOFRdbD5sVpwNWKqLYPBuUJh34Qg9z0For";

// export const signup = async (req, res) => {
//   const { name, dob, email, mobileNumber, password, pin } = req.body;

//   try {
//     const existingUser = await User.findOne({
//       $or: [{ email }, { mobileNumber }],
//     });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const hashedPin = await bcrypt.hash(pin, 10);

//     // Generate OTP (6 digits)
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 mins

//     // Create user with pending OTP verification
//     const newUser = new User({
//       name,
//       dob,
//       email,
//       mobileNumber,
//       password: hashedPassword,
//       pin: hashedPin,
//       otp: { code: otp, expiresAt: otpExpiration },
//     });

//     await newUser.save();

//     // Send OTP via Fast2SMS
//     await axios.post(
//       "https://www.fast2sms.com/dev/bulkV2",
//       {
//         route: "q",
//         message: `🛡️ VithU Safety Verification 🚨
// Your secure login code is: ${otp}`,
//         language: "english",
//         numbers: mobileNumber,
//       },
//       {
//         headers: { Authorization: FAST2SMS_API_KEY },
//       }
//     );

//     res.status(200).json({ message: "OTP sent to mobile. Please verify." });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Something went wrong." });
//   }
// };
// Step 1: Collect email, password, mobileNumber and send OTP
export const initiateSignup = async (req, res) => {
  const { email, password, mobileNumber } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { mobileNumber }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);
    console.log("otp is " + otp);
    const newUser = new User({
      email,
      mobileNumber,
      password: hashedPassword,
      otp: { code: otp, expiresAt: otpExpiration },
    });

    await newUser.save();

    // Send OTP
    // await axios.post(
    //   "https://www.fast2sms.com/dev/bulkV2",
    //   {
    //     route: "q",
    //     message: `Your OTP for signup is: ${otp}`,
    //     language: "english",
    //     numbers: mobileNumber,
    //   },
    //   {
    //     headers: { Authorization: FAST2SMS_API_KEY },
    //   }
    // );

    res.status(200).json({ message: "OTP sent. Please verify.", otp: otp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup initiation failed." });
  }
};
// Step 2: Verify OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.otp = null; // Clear OTP after successful verification
    user.isOtpVerified = true;
    await user.save();

    res
      .status(200)
      .json({ message: "OTP verified. Proceed to create your PIN." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP verification failed." });
  }
};
export const setPin = async (req, res) => {
  const { email, pin } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.pin = await bcrypt.hash(pin, 10);
    await user.save();

    res.status(200).json({ message: "PIN set successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong." });
  }
};
// Step 3: Add pin, name, and dob to complete registration
export const completeSignup = async (req, res) => {
  const { email, name, dob } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.isOtpVerified) {
      return res
        .status(400)
        .json({ message: "OTP not verified or user not found." });
    }

    user.name = name;
    user.dob = dob;
    await user.save();
    const token = jwt.sign(
      {
        userId: user._id,
        userName: user.name,
        mobileNumber: user.mobileNumber,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({ message: "Signup completed successfully.", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to complete signup." });
  }
};

export const signin = async (req, res) => {
  const { mobileNumber, pin } = req.body;

  try {
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) {
      return res.status(400).json({ message: "Invalid PIN." });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        userName: user.name,
        mobileNumber: user.mobileNumber,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      message: "Sign-in successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
      },
    });
  } catch (error) {
    console.error("Sign-in error:", error.message);
    res.status(500).json({ message: "Sign-in failed." });
  }
};
