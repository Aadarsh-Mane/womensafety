import Location from "../models/location.js";

// Controller to get safety info for source and destination based on time
export const getSafetyInfo = async (req, res) => {
  try {
    const { coordinates, time } = req.body;

    // Validate required fields
    if (
      !coordinates ||
      !coordinates.latitude ||
      !coordinates.longitude ||
      !time
    ) {
      return res
        .status(400)
        .json({ error: "Coordinates and time are required" });
    }

    // Find location by coordinates
    const location = await Location.findOne({
      "coordinates.latitude": coordinates.latitude,
      "coordinates.longitude": coordinates.longitude,
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    // Get time slot data
    const timeSlotData = location.time_slot_data[time];

    if (!timeSlotData) {
      return res.status(404).json({ error: "Time slot data not available" });
    }

    // Respond with the necessary safety details
    res.status(200).json({
      name: location.name,
      address: location.address,
      safety_score: timeSlotData.safety_score,
      factors: timeSlotData.factors,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
