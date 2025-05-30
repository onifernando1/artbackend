// server/app.js

const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const PORT = process.env.PORT || 3000;
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const multer = require("multer"); // <--- NEW: Import multer

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(
  cors({
    origin: "http://localhost:9000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// --- Multer Setup ---
// Configure multer to store files in memory.
// This is good for direct uploads to services like Cloudinary,
// as the file isn't saved to your server's disk first.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Optional: Limit file size to 5MB (adjust as needed)
  },
  fileFilter: (req, file, cb) => {
    // Optional: Filter file types to allow only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});
// --- End Multer Setup ---

// Express JSON body parser. Keep this for other JSON requests.
// IMPORTANT: This should generally come BEFORE your routes,
// but for routes handling 'multipart/form-data', Multer will handle the body.
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // For URL-encoded form data

// --- Import Routes ---
const paintingRoute = require("../routes/paintings");
const authRoute = require("../routes/auth");

// --- Mount Routes ---
// Apply `upload.single('image')` middleware ONLY to the route that handles image uploads.
// The string 'image' MUST match the 'name' attribute of your file input on the frontend.
// Ensure it's placed BEFORE your paintingController.createPainting
app.post("/painting", upload.single("image"), paintingRoute); // <-- NEW: Apply multer here
app.use("/painting", paintingRoute); // <-- This should be for other painting routes (GET, PUT, DELETE)
// If you have a separate file for 'paintingRoute' that defines POST
// then ensure the POST is specifically handled with multer there.
// It's more common to apply multer directly to the route that needs it,
// as shown on the line above this comment.

app.use("/api/auth", authRoute);

app.use(express.static(path.join(__dirname, "..", "public")));

// --- Global Error Handling Middleware (Good Practice) ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the stack trace for debugging
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  res.status(statusCode).json({
    status: "error",
    message: message,
  });
});
// --- End Global Error Handling Middleware ---

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
