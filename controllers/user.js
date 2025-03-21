import axios from "axios";
import bcrypt from "bcrypt";
import User from "../models/users.js";
import jwt from "jsonwebtoken";
import { Readable } from "stream";
import cloudinary from "../helpers/cloudinary.js";
import Goal from "../models/goals.js";
const JWT_SECRET = "vithuSafety";
import Incident from "../models/incidents.js";
import { uploadToCloudinary } from "../utils/uploadCloudinary.js";
import dotenv from "dotenv";
import twilio from "twilio";
import SosEmergency from "../models/helps.js";

const FAST2SMS_API_KEY =
  "WdZ9ew6msGSY2anqctkj437lUgC5b1oKIzf0p8DxrPTABJMOFRdbD5sVpwNWKqLYPBuUJh34Qg9z0For";
dotenv.config();

// Then create a separate file for your Twilio service:
// twilioService.js

const TWILIO_ACCOUNT_SID = "AC35d86e0d9c60d2eb91c76053c7c863e1";
const TWILIO_AUTH_TOKEN = "a0d4dc369bcf38fa486a1d6d44685b0c";
const TWILIO_PHONE_NUMBER = "+14152149378";

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

export const sendWelcomeMessage = async (req, res) => {
  // Verify Fast2SMS credentials are available
  if (!FAST2SMS_API_KEY) {
    console.error("Missing Fast2SMS API Key");
    return res.status(500).json({
      error: "SMS service unavailable. Please check server configuration.",
    });
  }

  const { phoneNumbers, latitude, longitude, url, deviceName, battery } =
    req.body;
  const userId = req.userId; // Getting userId from request

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

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

  const messageBody = `Welcome! Your location: Latitude ${latitude}, Longitude ${longitude}. Check this out: ${url}`;

  try {
    const results = await Promise.all(
      phoneNumbers.map(async (phoneNumber) => {
        let formattedNumber = phoneNumber.trim();

        // Remove any '+' or country code for Fast2SMS (expects only 10 digits)
        if (formattedNumber.startsWith("+91")) {
          formattedNumber = formattedNumber.substring(3);
        } else if (
          formattedNumber.startsWith("91") &&
          formattedNumber.length === 12
        ) {
          formattedNumber = formattedNumber.substring(2);
        }

        // Ensure we have a valid 10-digit Indian phone number
        if (!/^\d{10}$/.test(formattedNumber)) {
          return {
            phoneNumber,
            formattedNumber,
            error: "Invalid phone number format. Must be 10 digits.",
            status: "failed",
          };
        }

        try {
          const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
              route: "q", // Quick SMS route
              message: messageBody,
              language: "english",
              flash: 0,
              numbers: formattedNumber,
            },
            {
              headers: {
                Authorization: FAST2SMS_API_KEY,
                "Content-Type": "application/json",
              },
            }
          );

          // Fast2SMS response structure
          if (response.data.return === true) {
            return {
              phoneNumber,
              formattedNumber,
              messageId: response.data.request_id || "N/A",
              status: "sent",
              responseData: response.data,
            };
          } else {
            return {
              phoneNumber,
              formattedNumber,
              error: response.data.message || "Unknown error",
              status: "failed",
              responseData: response.data,
            };
          }
        } catch (messageError) {
          console.error(
            `Error sending message to ${formattedNumber}:`,
            messageError.response?.data || messageError.message
          );
          return {
            phoneNumber,
            formattedNumber,
            error: messageError.response?.data?.message || messageError.message,
            status: "failed",
          };
        }
      })
    );

    // Save the welcome message data to the database
    const welcomeMessageData = new SosEmergency({
      user: userId,
      deviceInfo: {
        deviceName: deviceName || "Unknown",
        battery: battery || null,
      },
      location: {
        latitude,
        longitude,
      },
      url,
      recipients: results.map((result) => ({
        phoneNumber: result.phoneNumber,
        formattedNumber: result.formattedNumber,
        status: result.status,
        messageId: result.messageId,
        error: result.error,
        responseData: result.responseData,
      })),
    });

    await welcomeMessageData.save();
    res.json(welcomeMessageData);
  } catch (error) {
    console.error("Unexpected error in sendWelcomeMessage:", error);
    res.status(500).json({ error: error.message });
  }
};

export const addContact = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, mobileNumber, email } = req.body;

    if (!name || !mobileNumber) {
      return res
        .status(400)
        .json({ message: "Name and mobile number are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.contacts.push({ name, mobileNumber, email });
    await user.save();

    res
      .status(200)
      .json({ message: "Contact added successfully", contacts: user.contacts });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -pin -otp");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createIncident = async (req, res) => {
  try {
    const { type, location, status, priority, description } = req.body;
    const reportedBy = req.userId;

    const incidentImage = req.files?.incidentImage?.[0];
    const incidentAudio = req.files?.incidentAudio?.[0];

    let imageUrl = null;
    let audioUrl = null;

    // Upload image with image specific settings
    if (incidentImage) {
      imageUrl = await uploadToCloudinary(incidentImage.buffer, {
        folder: "incidents/images",
        resource_type: "image",
      });
    }

    // Upload audio with different settings
    if (incidentAudio) {
      audioUrl = await uploadToCloudinary(incidentAudio.buffer, {
        folder: "incidents/audio",
        resource_type: "auto", // Let Cloudinary detect the type
      });
    }

    const user = await User.findById(reportedBy);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const newIncident = new Incident({
      type,
      reportedBy,
      reportedByName: user.name,
      location,
      status: status || "Active",
      priority,
      imageUrl,
      audioUrl, // Add audio URL to the model
      description,
    });

    await newIncident.save();
    res.status(201).json({
      message: "Incident reported successfully",
      incident: newIncident,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMyIncident = async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch incidents where reportedBy matches userId
    const incidents = await Incident.find({ reportedBy: userId });

    if (!incidents.length) {
      return res
        .status(404)
        .json({ message: "No incidents found for this user." });
    }

    res.status(200).json(incidents);
  } catch (error) {
    console.error("Error fetching user incidents:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
export const sendWelcomeMessage1 = async (req, res) => {
  // Verify Fast2SMS credentials are available
  if (!FAST2SMS_API_KEY) {
    console.error("Missing Fast2SMS API Key");
    return res.status(500).json({
      error: "SMS service unavailable. Please check server configuration.",
    });
  }

  const { latitude, longitude, url, deviceName, battery } = req.body;
  const userId = req.userId; // Getting userId from request

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // Fetch the user's contacts from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const contacts = user.contacts;

    if (!contacts || contacts.length === 0) {
      return res
        .status(400)
        .json({ error: "No emergency contacts found for this user" });
    }

    // Extract phone numbers from contacts
    const phoneNumbers = contacts.map((contact) => contact.mobileNumber);

    const messageBody = `Welcome! Your location: Latitude ${latitude}, Longitude ${longitude}. Check this out: ${url}`;

    const results = await Promise.all(
      phoneNumbers.map(async (phoneNumber) => {
        let formattedNumber = phoneNumber.trim();

        // Remove any '+' or country code for Fast2SMS (expects only 10 digits)
        if (formattedNumber.startsWith("+91")) {
          formattedNumber = formattedNumber.substring(3);
        } else if (
          formattedNumber.startsWith("91") &&
          formattedNumber.length === 12
        ) {
          formattedNumber = formattedNumber.substring(2);
        }

        // Ensure we have a valid 10-digit Indian phone number
        if (!/^\d{10}$/.test(formattedNumber)) {
          return {
            phoneNumber,
            formattedNumber,
            error: "Invalid phone number format. Must be 10 digits.",
            status: "failed",
          };
        }

        try {
          const response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            {
              route: "q", // Quick SMS route
              message: messageBody,
              language: "english",
              flash: 0,
              numbers: formattedNumber,
            },
            {
              headers: {
                Authorization: FAST2SMS_API_KEY,
                "Content-Type": "application/json",
              },
            }
          );

          // Fast2SMS response structure
          if (response.data.return === true) {
            return {
              phoneNumber,
              formattedNumber,
              messageId: response.data.request_id || "N/A",
              status: "sent",
              responseData: response.data,
            };
          } else {
            return {
              phoneNumber,
              formattedNumber,
              error: response.data.message || "Unknown error",
              status: "failed",
              responseData: response.data,
            };
          }
        } catch (messageError) {
          console.error(
            `Error sending message to ${formattedNumber}:`,
            messageError.response?.data || messageError.message
          );
          return {
            phoneNumber,
            formattedNumber,
            error: messageError.response?.data?.message || messageError.message,
            status: "failed",
          };
        }
      })
    );

    // Save the welcome message data to the database
    const welcomeMessageData = new SosEmergency({
      user: userId,
      deviceInfo: {
        deviceName: deviceName || "Unknown",
        battery: battery || null,
      },
      location: {
        latitude,
        longitude,
      },
      url,
      recipients: results.map((result) => ({
        phoneNumber: result.phoneNumber,
        formattedNumber: result.formattedNumber,
        status: result.status,
        messageId: result.messageId,
        error: result.error,
        responseData: result.responseData,
      })),
    });

    await welcomeMessageData.save();
    res.json(welcomeMessageData);
  } catch (error) {
    console.error("Unexpected error in sendWelcomeMessage:", error);
    res.status(500).json({ error: error.message });
  }
};
