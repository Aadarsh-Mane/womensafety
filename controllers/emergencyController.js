import EmergencyService from "../models/emergency.js";
import axios from "axios";
import twilio from "twilio";

export const findNearbyEmergencyServicesFromDB = async (
  longitude,
  latitude,
  type,
  maxDistance = 10000
) => {
  try {
    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistance, // meters
        },
      },
    };

    // Add type filter if specified
    if (type) {
      query.type = type;
    }

    const services = await EmergencyService.find(query).limit(3);
    return services;
  } catch (error) {
    console.error("Error finding emergency services in DB:", error);
    return [];
  }
};
export const sendEmergencySMS = async (req, res) => {
  try {
    const { message, longitude, latitude, type } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // First find emergency services
    const services = await findNearbyEmergencyServicesFromDB(
      latitude,
      longitude,
      type
    );

    if (!services || services.length === 0) {
      return res
        .status(404)
        .json({ error: "No emergency services found in the area" });
    }

    // Track SMS sending results
    const results = [];

    // Send SMS to each service
    for (const service of services) {
      if (service.phoneNumber) {
        try {
          // Use your SMS provider API here. This is an example with a generic SMS API
          const smsResponse = await sendSMS(service.phoneNumber, message);

          results.push({
            serviceName: service.name,
            phoneNumber: service.phoneNumber,
            success: true,
            messageId: smsResponse.messageId,
          });
        } catch (smsError) {
          console.error(`Error sending SMS to ${service.name}:`, smsError);

          results.push({
            serviceName: service.name,
            phoneNumber: service.phoneNumber,
            success: false,
            error: smsError.message,
          });
        }
      }
    }

    return res.json({
      totalServices: services.length,
      messagesSent: results.filter((r) => r.success).length,
      messagesFailed: results.filter((r) => !r.success).length,
      details: results,
    });
  } catch (error) {
    console.error("Error in sendEmergencySMS:", error);
    return res.status(500).json({ error: "Failed to send emergency SMS" });
  }
};
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Helper function to send SMS using your SMS provider
// Replace this with your actual SMS provider implementation
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendSMS = async (phoneNumber, message) => {
  // Example using a generic SMS API service
  // You should replace this with your actual SMS provider's API
  try {
    const message = await client.messages.create({
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
      body: message,
    });

    return { messageId: response.data.messageId };
  } catch (error) {
    console.error("SMS Provider Error:", error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

// Find nearby emergency services using Google Places API
export const findNearbyEmergencyServicesFromAPI = async (
  latitude,
  longitude,
  type
) => {
  try {
    const API_KEY = "AIzaSyAnFzm0egXHx7P7zBsOjC3NV01Wj3ZHgyo"; // Use the same API key for consistency

    // First, search for nearby places
    const placesResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params: {
          location: `${latitude},${longitude}`,
          radius: 5000, // 100km radius (you've increased this from 5km)
          type: type === "police" ? "police" : "hospital",
          key: API_KEY,
        },
      }
    );

    // If no results, return empty array
    if (
      !placesResponse.data.results ||
      placesResponse.data.results.length === 0
    ) {
      return [];
    }

    // For each place, get details including phone number
    const services = [];
    for (let i = 0; i < Math.min(3, placesResponse.data.results.length); i++) {
      const place = placesResponse.data.results[i];

      try {
        // Use the place_id from the search results, not a hardcoded one
        const detailsResponse = await axios.get(
          "https://maps.googleapis.com/maps/api/place/details/json",
          {
            params: {
              place_id: place.place_id, // This was hardcoded before
              fields: "name,formatted_phone_number,formatted_address",
              key: API_KEY, // Use same API key variable here
            },
          }
        );

        if (
          detailsResponse.data.result &&
          detailsResponse.data.result.formatted_phone_number
        ) {
          services.push({
            name: place.name,
            type: type,
            phoneNumber: detailsResponse.data.result.formatted_phone_number,
            address: detailsResponse.data.result.formatted_address,
            location: {
              type: "Point",
              coordinates: [
                place.geometry.location.lng,
                place.geometry.location.lat,
              ],
            },
          });
        }
      } catch (detailsError) {
        console.error("Error getting place details:", detailsError);
      }
    }

    return services;
  } catch (error) {
    console.error("Error finding emergency services from API:", error);
    return [];
  }
};
export const findEmergencyServices = async (req, res) => {
  const { longitude, latitude, type } = req.body;
  // Initialize services as an empty array instead of using DB
  let services = [];

  // Use the API directly
  const apiServices = await findNearbyEmergencyServicesFromAPI(
    latitude,
    longitude,
    type
  );

  // Combine results, avoiding duplicates
  const existingPhoneNumbers = new Set(services.map((s) => s.phoneNumber));
  for (const service of apiServices) {
    if (!existingPhoneNumbers.has(service.phoneNumber)) {
      services.push(service);
      existingPhoneNumbers.add(service.phoneNumber);
    }

    // Stop if we have enough services
    if (services.length >= 3) break;
  }

  return res.json(services);
};
