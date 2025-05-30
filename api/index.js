// api/index.js (This file will be deployed to Vercel)

// Ensure dotenv is loaded very early for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path"); // Keep for path.join if needed, but static serving often removed for Vercel backend
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const multer = require("multer");

const app = express();

// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// --- CORS Configuration ---
// IMPORTANT: For production, change '*' to your specific frontend URL (e.g., 'https://your-frontend-app.vercel.app')
// Use an environment variable for CLIENT_ORIGIN
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*", // Fallback to '*' for development/testing if env var isn't set
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// --- Multer Setup ---
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory buffer
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});
// --- End Multer Setup ---

// --- Express Body Parsers ---
app.use(express.json()); // For application/json
app.use(express.urlencoded({ extended: false })); // For URL-encoded form data

// --- Import Routes ---
// Adjust paths based on your actual backend project structure relative to api/index.js
const paintingRoutes = require("../routes/paintings"); // Assuming 'routes' is sibling to 'api'
const authRoutes = require("../routes/auth"); // Assuming 'routes' is sibling to 'api'

// --- Mount Routes ---
// The `upload.single('imageFile')` middleware will handle the 'multipart/form-data' for image uploads.
// The string 'imageFile' MUST match the 'name' attribute of your file input on the frontend.
app.post("/painting", upload.single("imageFile"), paintingRoutes); // For POST requests with an image

// For other painting-related routes (GET, PUT, DELETE) that don't involve file uploads
// Assuming paintingRoutes exports a router that handles other methods too.
app.use("/painting", paintingRoutes);

app.use("/api/auth", authRoutes); // Assuming your auth routes are prefixed with /api/auth

// --- Root Route for Vercel Health Check / Basic Test ---
app.get("/", (req, res) => {
  res.status(200).send("Art Backend API is running!");
});

// --- Global Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  res.status(statusCode).json({
    status: "error",
    message: message,
  });
});
// --- End Global Error Handling Middleware ---

// --- Database Connection ---
// In a serverless environment, this connection will run on each cold start,
// but Mongoose handles connection pooling effectively for warm starts.
mongoose
  .connect(process.env.MONG_URI, {
    useNewUrlParser: true, // Deprecated, but harmless if used
    useUnifiedTopology: true, // Deprecated, but harmless if used
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  })
  .then(() => {
    console.log("MongoDB connected successfully");
    // Only start the Express server for local development, Vercel handles this.
    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 5000; // Use a different port for backend locally if frontend runs on 3000
      app.listen(PORT, () => {
        console.log(`Local server listening on ${PORT}`);
      });
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    // In a serverless function, you might not want to exit the process
    // but rather handle the error for the current request.
    // For local dev, process.exit(1) or similar might be useful.
  });

// --- IMPORTANT: Export the Express app for Vercel ---
module.exports = app;
