import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import { connectDB } from "./dbConnect.js";
import userRouter from "./routes/user.js";

const port = 3001;

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
app.get("/", (req, res) => {
  return res.status(200).json("Welcome to WomenSafety ! v2 ❤️");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
