import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import { connectDB } from "./dbConnect.js";
import userRouter from "./routes/user.js";
import womenRouter from "./routes/women.js";
import locationRouter from "./routes/location.js";
import adminRouter from "./routes/admin.js";

const port = 9000;

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for URL-encoded bodies
app.use(cors());
// app.use(
//   cors({
//     origin: "*", // Or specify a domain like 'http://yourwebapp.com'
//     methods: ["GET", "POST"],
//   })
// );

connectDB();
app.use("/users", userRouter);
app.use("/women", womenRouter);
app.use("/location", locationRouter);
app.use("/admin", adminRouter);
app.get("/", (req, res) => {
  return res.status(200).json("Welcome to WomenSafety ! v2 ❤️");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
