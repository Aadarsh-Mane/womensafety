import Incident from "../models/incidents.js";
import User from "../models/users.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -pin -otp");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// export const getAllIncidents = async (req, res) => {
//   try {
//     const incidents = await Incident.find()
//       .populate("reportedBy", "name")
//       .sort({ createdAt: -1 }); // Sort by latest createdAt first

//     const formattedIncidents = incidents.map((incident) => ({
//       ...incident._doc,
//       time: new Date(incident.time).toLocaleString("en-IN", {
//         timeZone: "Asia/Kolkata",
//       }),
//     }));

//     res.status(200).json(formattedIncidents);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
export const getAllIncidents = async (req, res) => {
  try {
    const { status, priority } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const incidents = await Incident.find(filter).populate(
      "reportedBy",
      "name"
    );
    //   .sort({ createdAt: -1 }); // Latest first

    const formattedIncidents = incidents.map((incident) => ({
      ...incident._doc,
      time: new Date(incident.time).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    }));

    res.status(200).json(formattedIncidents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getIncidentCounts = async (req, res) => {
  try {
    const counts = await Incident.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Incident.countDocuments();

    const result = {
      Active: 0,
      Pending: 0,
      Resolved: 0,
      Total: total,
    };

    counts.forEach((item) => {
      result[item._id] = item.count;
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getRecentIncidents = async (req, res) => {
  try {
    const { status, priority } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const incidents = await Incident.find(filter)
      .populate("reportedBy", "name")
      .sort({ createdAt: -1 }); // Latest first

    const formattedIncidents = incidents.map((incident) => ({
      ...incident._doc,
      time: new Date(incident.time).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    }));

    res.status(200).json(formattedIncidents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
