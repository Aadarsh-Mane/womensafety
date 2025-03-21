import express from "express";
import http from "http";
import cors from "cors";
import { connectDB } from "./dbConnect.js";
import userRouter from "./routes/user.js";
import womenRouter from "./routes/women.js";
import locationRouter from "./routes/location.js";
import adminRouter from "./routes/admin.js";
import axios from "axios";
import * as cheerio from "cheerio";
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
const newspapers = [
  {
    name: "bbc",
    address: "https://www.thelivelovelaughfoundation.org/find-help/therapist",
    base: "",
  },
];

const articles = [];

newspapers.forEach((newspaper) => {
  axios
    .get(newspaper.address)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $("div.col_33").each(function () {
        const article = {
          source: newspaper.name,
          image: "",
          subHeading: "",
          desig: "",
          fullDesc: "",
          details: {},
          specializations: [],
        };

        // Extract image URL
        const userImg = $(this).find(".userImg img");
        article.image = userImg.attr("data-src") || userImg.attr("src") || "";

        // Extract text content
        article.subHeading = $(this).find(".subHeading").text().trim();
        article.desig = $(this).find(".desig").text().trim();
        article.fullDesc = $(this).find(".fullDesc.line-clamp-2").text().trim();

        // Process list items
        $(this)
          .find("ul li")
          .each(function () {
            const item = $(this).text().trim();
            if (!item) return;

            if (item.startsWith("Area of Specialization:")) {
              const specializationText = item.split(":")[1].trim();
              article.specializations = specializationText
                .split(",")
                .map((s) => s.trim().replace(/\.$/, ""));
            } else {
              // Split into key-value pairs
              const [key, ...valueParts] = item.split(":");
              const value = valueParts.join(":").trim();

              // Clean up key and value
              const cleanKey = key.trim().replace(/\s+/g, " ");
              const cleanValue = value
                .replace(/\s+/g, " ")
                .replace(/\t/g, "")
                .trim();

              // Add to details object
              article.details[cleanKey] = cleanValue;
            }
          });

        // Only push if there's valid content
        if (
          article.image ||
          article.subHeading ||
          article.desig ||
          article.fullDesc ||
          Object.keys(article.details).length > 0 ||
          article.specializations.length > 0
        ) {
          articles.push(article);
        }
      });
    })
    .catch((err) => console.log(err));
});

app.get("/admin/news", (req, res) => {
  res.json(articles);
});
app.get("/", (req, res) => {
  return res.status(200).json("Welcome to WomenSafety ! v2 ❤️");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
