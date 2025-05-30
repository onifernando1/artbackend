// api/index.js (This file will be deployed to Vercel)

// Ensure dotenv is loaded very early for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const multer = require("multer");

const app = express();

// --- START: MODIFIED DEBUGGING CODE ---
const fs = require("fs");
const util = require("util");

const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile); // <-- NEW: Promisified readFile
const stat = util.promisify(fs.stat);

async function listDirectory(dirPath, indent = "") {
  try {
    const files = await readDir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      let fileStat;
      try {
        fileStat = await stat(filePath);
      } catch (statError) {
        // If stat fails (e.g., symlink issues or permissions), just log and skip
        console.warn(
          `${indent}├── ${file} (Error stat-ing: ${statError.message})`
        );
        continue;
      }

      if (fileStat.isDirectory()) {
        console.log(`${indent}├── ${file}/`);
        // Limit recursion depth slightly to avoid excessively long logs on large dirs
        if (indent.length < 8) {
          // Max 2-3 levels deep for this debug
          await listDirectory(filePath, indent + "│   ");
        } else {
          console.log(`${indent}│   └── (Max depth reached for ${file})`);
        }
      } else {
        console.log(`${indent}├── ${file}`);
      }
    }
  } catch (e) {
    console.error(
      `${indent}CRITICAL ERROR: Failed to read directory ${dirPath}:`,
      e.message
    );
    console.error(e.stack);
  }
}

async function performStartupDebug() {
  console.log("--- Vercel Serverless Function Cold Start Debug ---");
  console.log("Current working directory (process.cwd()):", process.cwd());
  console.log("Directory of this file (__dirname):", __dirname);

  console.log("--- Attempting to list /var/task/ contents (Function Root) ---");
  await listDirectory("/var/task/"); // This call should show us files if they exist
  console.log("--- Finished listing /var/task/ contents ---");

  console.log("--- Attempting to list /var/task/api/ contents ---");
  await listDirectory("/var/task/api/"); // This call should show us files if they exist inside api
  console.log("--- Finished listing /var/task/api/ contents ---");

  // --- READ AND PRINT FILE CONTENTS ---
  console.log("--- Reading api/index.js content (first 500 chars) ---");
  try {
    // __dirname is /var/task/api, so 'index.js' is correct relative path
    const indexPath = path.join(__dirname, "index.js");
    const indexContent = await readFile(indexPath, "utf8");
    console.log(
      "api/index.js content:",
      indexContent.substring(0, Math.min(indexContent.length, 500)) +
        (indexContent.length > 500 ? "..." : "")
    );
    if (indexContent.includes("../routes/paintings")) {
      console.warn(
        "WARNING: api/index.js content contains the old path '../routes/paintings'!"
      );
    } else {
      console.log(
        "CONFIRMED: api/index.js content uses correct relative path (e.g., './routes/paintings')."
      );
    }
  } catch (e) {
    console.error("ERROR reading api/index.js content:", e.message);
    console.error(e.stack);
  }

  console.log("--- Reading routes/paintings.js content (first 500 chars) ---");
  try {
    // Assuming routes/paintings.js is at /var/task/api/routes/paintings.js
    const paintingsPath = path.join(__dirname, "routes/paintings.js");
    const paintingsContent = await readFile(paintingsPath, "utf8");
    console.log(
      "routes/paintings.js content:",
      paintingsContent.substring(0, Math.min(paintingsContent.length, 500)) +
        (paintingsContent.length > 500 ? "..." : "")
    );
  } catch (e) {
    console.error("ERROR reading routes/paintings.js content:", e.message);
    console.error(e.stack);
  }
  // --- END READ AND PRINT FILE CONTENTS ---

  console.log(
    "--- Attempting direct require of paintingController from api/index.js ---"
  );
  try {
    // This require might still cause a crash if the file isn't there or has issues
    // Path here should be relative to api/index.js as if in /var/task/api/
    const testController = require("./controllers/paintingController");
    console.log("Direct require of paintingController SUCCESS!");
    console.log(
      "Keys available on testController:",
      Object.keys(testController)
    );
  } catch (e) {
    console.error(
      "Direct require of paintingController FAILED (from api/index.js):",
      e.message
    );
    console.error(e.stack);
  }
  console.log("--- End of Direct require test ---");

  console.log("--- End Vercel Serverless Function Cold Start Debug ---");
}

// Call the debug function IMMEDIATELY when the serverless function starts
// This will run BEFORE any other application setup or route imports
performStartupDebug();

// --- END: ADDED DEBUGGING CODE ---

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

// --- Multer Setup ---
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

// --- Import Routes ---
// The crash usually happens here
// TEMPORARILY COMMENT THESE OUT IF THE DEBUG LOGS ARE STILL CUTTING OFF
// We need to ensure the debug code runs fully.
const paintingRoutes = require("./routes/paintings");
const authRoutes = require("./routes/auth");

// --- Mount Routes ---
app.post("/painting", upload.single("imageFile"), paintingRoutes);
app.use("/painting", paintingRoutes);
app.use("/api/auth", authRoutes);

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
      const PORT = process.env.PORT || 5000;
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
