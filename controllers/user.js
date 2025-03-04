import axios from "axios";
import bcrypt from "bcrypt";
import User from "../models/users.js";
import jwt from "jsonwebtoken";
import { Readable } from "stream";
import cloudinary from "../helpers/cloudinary.js";
import Goal from "../models/goals.js";
const JWT_SECRET = "vithuSafety";
import twilio from "twilio";
const FAST2SMS_API_KEY =
  "WdZ9ew6msGSY2anqctkj437lUgC5b1oKIzf0p8DxrPTABJMOFRdbD5sVpwNWKqLYPBuUJh34Qg9z0For";
import crypto from "crypto";

const linkStore = new Map(); // Temporary store for short links

// Generate a short, random token for the URL
const generateShortLink = (url) => {
  const token = crypto.randomBytes(6).toString("hex");
  linkStore.set(token, url); // Store the full URL against the token
  return `https://womensafety-1-5znp.onrender.com/short-link/${token}`;
};

// Handle short link redirection
export const handleShortLink = (req, res) => {
  const { token } = req.params;
  const url = linkStore.get(token);

  if (url) {
    res.redirect(url);
  } else {
    res.status(404).json({ error: "Invalid or expired link" });
  }
};

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

    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your OTP for signup is: ${otp}`,
        language: "english",
        numbers: mobileNumber,
      },
      {
        headers: { Authorization: FAST2SMS_API_KEY },
      }
    );

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
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId).select("-password -otp");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, dob, email, mobileNumber, pin } = req.body;
    const itemImage = req.file;

    let imageUrl;

    // Handle image upload to Cloudinary
    if (itemImage) {
      const bufferStream = new Readable();
      bufferStream.push(itemImage.buffer);
      bufferStream.push(null);

      imageUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: "user_profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        bufferStream.pipe(uploadStream);
      });
    }

    // Build the update object dynamically
    const updatedData = {};
    if (name) updatedData.name = name;
    if (dob) updatedData.dob = dob;
    if (email) updatedData.email = email;
    if (mobileNumber) updatedData.mobileNumber = mobileNumber;
    if (pin) updatedData.pin = pin;
    if (imageUrl) updatedData.profileImage = imageUrl;

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    }).select("-password -otp");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const createGoal = async (req, res) => {
  try {
    const {
      category,
      goalName,
      customCategory,
      targetAmount,
      initialSaving,
      targetDate,
    } = req.body;
    const userId = req.userId; // from auth middleware

    const remainingAmount = targetAmount - initialSaving;

    const goal = new Goal({
      userId,
      category,
      goalName,
      customCategory: category === "custom" ? customCategory : undefined,
      targetAmount,
      initialSaving,
      currentAmount: initialSaving,
      remainingAmount,
      targetDate,
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create goal", error: err.message });
  }
};

// Controller to deposit to a goal
export const depositToGoal = async (req, res) => {
  try {
    const { goalId, depositAmount } = req.body;
    const userId = req.userId;

    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    goal.currentAmount += depositAmount;
    goal.remainingAmount = Math.max(goal.remainingAmount - depositAmount, 0);

    await goal.save();
    res.status(200).json(goal);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to deposit to goal", error: err.message });
  }
};

export const getGoals = async (req, res) => {
  try {
    const { category, goalName } = req.query; // optional filters
    const userId = req.userId;

    const filter = { userId };
    if (category) filter.category = category;
    if (goalName) filter.goalName = new RegExp(goalName, "i"); // case-insensitive search

    const goals = await Goal.find(filter);
    res.status(200).json(goals);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch goals", error: err.message });
  }
};
const TWILIO_ACCOUNT_SID = "AC04daf2f6c444bd38388d868da5987763";
const TWILIO_AUTH_TOKEN = "88d133515326fa69bcc093762712a783";
const TWILIO_PHONE_NUMBER = "+13134762280";

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
export const sendWelcomeMessage = async (req, res) => {
  const { phoneNumbers, latitude, longitude, url } = req.body;

  if (
    !phoneNumbers ||
    !Array.isArray(phoneNumbers) ||
    phoneNumbers.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "At least one phone number is required" });
  }

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const secureUrl = generateShortLink(url);
  const messageBody = `Welcome! Your location: Latitude ${latitude}, Longitude ${longitude}. Check this out: ${secureUrl}`;

  try {
    const results = await Promise.all(
      phoneNumbers.map(async (phoneNumber) => {
        let formattedNumber = phoneNumber.trim();

        if (!formattedNumber.startsWith("+91")) {
          formattedNumber =
            formattedNumber.startsWith("91") && formattedNumber.length === 12
              ? `+${formattedNumber}`
              : `+91${formattedNumber}`;
        }

        const message = await client.messages.create({
          from: TWILIO_PHONE_NUMBER,
          to: formattedNumber,
          body: messageBody,
        });

        return { phoneNumber: formattedNumber, messageSid: message.sid };
      })
    );

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
