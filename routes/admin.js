import express from "express";
import {
  deleteIncident,
  getAlertCounts,
  getAlertsByStatus,
  getAllIncidents,
  getIncidentCounts,
  getRecentIncidents,
  updateAlertStatus,
  updateIncidentPriority,
  updateIncidentStatus,
} from "../controllers/adminController.js";
import { getAllUsers } from "../controllers/user.js";

const adminRouter = express.Router();

adminRouter.get("/getAllIncidents", getAllIncidents);

adminRouter.get("/getAllUsers", getAllUsers);
adminRouter.get("/getIncidentCounts", getIncidentCounts);
adminRouter.get("/getRecentIncidents", getRecentIncidents);
adminRouter.patch("/updateIncidentPriority/:id", updateIncidentPriority);
adminRouter.patch("/updateIncidentStatus/:id", updateIncidentStatus);
adminRouter.delete("/deleteIncident", deleteIncident);
adminRouter.patch("/updateAlertStatus/:alertId", updateAlertStatus);
adminRouter.get("/getAlertsByStatus", getAlertsByStatus);
adminRouter.get("/getAlertCounts", getAlertCounts);

export default adminRouter;
