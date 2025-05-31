// index.js

// Ensure dotenv is loaded very early for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const multer = require("multer"); // <--- This is correctly present, but the setup is missing!

const app = express();

// --- Add this line here to see where __dirname points ---
console.log("__dirname is:", __dirname);

// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// --- CORS Configuration ---
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// --- Multer Setup --- <--- THIS WHOLE BLOCK WAS MISSING
const upload = multer({
  storage: multer.memoryStorage(),
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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Serve Static Files (Crucial for your HTML, CSS, JS) ---
app.use(express.static(path.join(__dirname, "public")));
// --- Add this line to see what path static is serving from ---
console.log("Express static serving from:", path.join(__dirname, "public"));

// --- Import Routes ---
const paintingRoutes = require("./routes/paintings");
const authRoutes = require("./routes/auth");

// --- Mount API Routes ---
// Line 44 (approx) that was causing the error now has 'upload' defined
app.post("/api/painting", upload.single("imageFile"), paintingRoutes);
app.use("/api/painting", paintingRoutes);
app.use("/api/auth", authRoutes);

// --- Root Route for Initial Load ---
app.get("/", (req, res) => {
  // --- Add this line to see the exact path res.sendFile is trying to use ---
  const filePath = path.join(__dirname, "public", "index.html");
  console.log("Attempting to send file from:", filePath);

  res.sendFile(filePath, (err) => {
    if (err) {
      // Log specific error if sendFile fails
      console.error("Error sending file (sendFile callback):", err);
      // Only send a 500 if the response hasn't already been sent by the global error handler
      if (!res.headersSent) {
        res.status(500).json({
          status: "error",
          message: `Failed to load index.html: ${err.message}`,
        });
      }
    } else {
      console.log("Successfully sent index.html");
    }
  });
});

// --- Global Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack); // Added label
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  if (!res.headersSent) {
    // Prevent sending headers if already sent
    res.status(statusCode).json({
      status: "error",
      message: message,
    });
  }
});
// --- End Global Error Handling Middleware ---

// --- Database Connection ---
mongoose
  .connect(process.env.MONG_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Local server listening on ${PORT}`);
      });
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// --- IMPORTANT: Export the Express app for Vercel ---
module.exports = app;
