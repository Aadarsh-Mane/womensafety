import express from "express";
import {
  getAllIncidents,
  getIncidentCounts,
  getRecentIncidents,
} from "../controllers/adminController.js";
import { getAllUsers } from "../controllers/user.js";

const adminRouter = express.Router();

adminRouter.get("/getAllIncidents", getAllIncidents);

adminRouter.get("/getAllUsers", getAllUsers);
adminRouter.get("/getIncidentCounts", getIncidentCounts);
adminRouter.get("/getRecentIncidents", getRecentIncidents);

export default adminRouter;
