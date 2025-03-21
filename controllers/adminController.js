import Alert from "../models/alerts.js";
import SosEmergency from "../models/helps.js";
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

export const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Pending", "Resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.status(200).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateIncidentPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({ message: "Invalid priority value" });
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      { priority },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.status(200).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Incident
export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findByIdAndDelete(id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.status(200).json({ message: "Incident deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status } = req.body;
    console.log(alertId);

    // Validate status
    const validStatuses = ["Active", "Responding", "Resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find and update alert
    const updatedAlert = await Alert.findByIdAndUpdate(
      alertId,
      { status },
      { new: true }
    );

    if (!updatedAlert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    res.status(200).json({
      message: "Alert status updated successfully",
      alert: updatedAlert,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
export const getAlertsByStatus = async (req, res) => {
  try {
    const { status } = req.query; // Get status from query params

    // Validate status
    const validStatuses = ["Active", "Responding", "Resolved"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Fetch alerts (filter by status if provided)
    const filters = status ? { status } : {}; // If no status, return all alerts
    const alerts = await Alert.find(filters).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Alerts fetched successfully",
      alerts,
    });
  } catch (error) {
    console.error("❌ Error fetching alerts:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
export const getAlertCounts = async (req, res) => {
  try {
    const counts = await Alert.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert array to object { Active: X, Responding: Y, Resolved: Z }
    const statusCounts = { Active: 0, Responding: 0, Resolved: 0 };
    counts.forEach(({ _id, count }) => {
      statusCounts[_id] = count;
    });

    res.status(200).json({
      message: "Alert counts fetched successfully",
      counts: statusCounts,
    });
  } catch (error) {
    console.error("❌ Error fetching alert counts:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
export const listEmergencies = async (req, res) => {
  try {
    const { userId, startDate, endDate, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query filters
    const query = {};

    // Filter by user if provided
    if (userId) {
      query.user = userId;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const total = await SosEmergency.countDocuments(query);

    // Get emergencies with pagination
    const emergencies = await SosEmergency.find(query)
      .populate("user", "name email phone") // Populate user data
      .sort({ createdAt: -1 }) // Sort by most recent first
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate metrics
    const sentMessages = emergencies.reduce((count, emergency) => {
      return (
        count + emergency.recipients.filter((r) => r.status === "sent").length
      );
    }, 0);

    const failedMessages = emergencies.reduce((count, emergency) => {
      return (
        count + emergency.recipients.filter((r) => r.status === "failed").length
      );
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        emergencies,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
        metrics: {
          totalEmergencies: total,
          sentMessages,
          failedMessages,
          successRate:
            total > 0
              ? (
                  (sentMessages / (sentMessages + failedMessages)) *
                  100
                ).toFixed(2) + "%"
              : "0%",
        },
      },
    });
  } catch (error) {
    console.error("Error in listEmergencies:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred",
    });
  }
};
