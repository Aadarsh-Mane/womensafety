import express from "express";

import { getSafetyInfo } from "../controllers/locationController.js";

const locationRouter = express.Router();

//locationRouter.post("/signup", signup);
// locationRouter.post("/api/v1/createOrder", createOrder);
// router.post('/add-community', upload.single('image'), async (req, res) => {

locationRouter.post("/getSafetyInfo", getSafetyInfo);

export default locationRouter;
