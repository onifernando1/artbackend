// server/app.js

const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const PORT = process.env.PORT || 3000;
const cloudinary = require("cloudinary").v2;
const cors = require("cors"); // Import the cors middleware

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(
  cors({
    origin: "http://localhost:9000", // <--- THIS IS THE KEY!
    // This tells the backend to allow requests
    // from your React app running on port 9000.
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow sending of cookies/authentication headers (if applicable)
  })
);

app.use(express.json()); // Essential for parsing JSON request bodies

// --- Import Routes ---
const paintingRoute = require("../routes/paintings");
const authRoute = require("../routes/auth"); // NEW: Import auth routes

// --- Mount Routes ---
app.use("/painting", paintingRoute);
app.use("/api/auth", authRoute); // NEW: Mount auth routes under /api/auth

app.use(express.static(path.join(__dirname, "..", "public")));

// Connect to DB
mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });

("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzc4Y2IwYTU4YzFmYWNhM2M3ODY4YSIsImlhdCI6MTc0ODQ3MDk2MCwiZXhwIjoxNzQ4NDc0NTYwfQ.6FWKIxXbDlyqWZfeOzm-p-g244aFZDg0igVvvIICu-Q");
