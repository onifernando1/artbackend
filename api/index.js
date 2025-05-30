// // api/index.js (This file will be deployed to Vercel)

// // Ensure dotenv is loaded very early for local development
// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }

// const express = require("express");
// const mongoose = require("mongoose");
// const path = require("path"); // Keep for path.join if needed, but static serving often removed for Vercel backend
// const cloudinary = require("cloudinary").v2;
// const cors = require("cors");
// const multer = require("multer");

// const app = express();

// // Add these imports at the top, along with other 'require' statements
// const fs = require("fs");
// const util = require("util");

// // Add these utility functions somewhere in your api/index.js,
// // for example, just before the first app.get() or app.use()
// const readDir = util.promisify(fs.readdir);
// const stat = util.promisify(fs.stat);

// async function listDirectory(dirPath, indent = "") {
//   try {
//     const files = await readDir(dirPath);
//     for (const file of files) {
//       const filePath = path.join(dirPath, file); // Make sure 'path' is imported at the top
//       const fileStat = await stat(filePath);
//       if (fileStat.isDirectory()) {
//         console.log(`${indent}├── ${file}/`);
//         await listDirectory(filePath, indent + "│   ");
//       } else {
//         console.log(`${indent}├── ${file}`);
//       }
//     }
//   } catch (e) {
//     console.error(`${indent}Error listing ${dirPath}:`, e.message);
//   }
// }

// // Add this temporary endpoint, perhaps right after your other app.get('/') route
// app.get("/debug-files", async (req, res) => {
//   console.log("--- Listing /var/task/ contents ---");
//   await listDirectory("/var/task/"); // This will list the contents of the deployed function's root
//   console.log("--- Finished listing /var/task/ contents ---");
//   res.status(200).send("Check Vercel logs for directory listing.");
// });

// // --- Cloudinary Configuration ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// // --- CORS Configuration ---
// // IMPORTANT: For production, change '*' to your specific frontend URL (e.g., 'https://your-frontend-app.vercel.app')
// // Use an environment variable for CLIENT_ORIGIN
// app.use(
//   cors({
//     origin: process.env.CLIENT_ORIGIN || "*", // Fallback to '*' for development/testing if env var isn't set
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );

// // --- Multer Setup ---
// const upload = multer({
//   storage: multer.memoryStorage(), // Store files in memory buffer
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB file size limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith("image/")) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only image files are allowed!"), false);
//     }
//   },
// });
// // --- End Multer Setup ---

// // --- Express Body Parsers ---
// app.use(express.json()); // For application/json
// app.use(express.urlencoded({ extended: false })); // For URL-encoded form data

// // --- Import Routes ---
// // Adjust paths based on your actual backend project structure relative to api/index.js
// const paintingRoutes = require("../routes/paintings"); // Assuming 'routes' is sibling to 'api'
// const authRoutes = require("../routes/auth"); // Assuming 'routes' is sibling to 'api'

// // --- Mount Routes ---
// // The `upload.single('imageFile')` middleware will handle the 'multipart/form-data' for image uploads.
// // The string 'imageFile' MUST match the 'name' attribute of your file input on the frontend.
// app.post("/painting", upload.single("imageFile"), paintingRoutes); // For POST requests with an image

// // For other painting-related routes (GET, PUT, DELETE) that don't involve file uploads
// // Assuming paintingRoutes exports a router that handles other methods too.
// app.use("/painting", paintingRoutes);

// app.use("/api/auth", authRoutes); // Assuming your auth routes are prefixed with /api/auth

// // --- Root Route for Vercel Health Check / Basic Test ---
// app.get("/", (req, res) => {
//   res.status(200).send("Art Backend API is running!");
// });

// // --- Global Error Handling Middleware ---
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   const statusCode = err.statusCode || 500;
//   const message = err.message || "Something went wrong!";
//   res.status(statusCode).json({
//     status: "error",
//     message: message,
//   });
// });
// // --- End Global Error Handling Middleware ---

// // --- Database Connection ---
// // In a serverless environment, this connection will run on each cold start,
// // but Mongoose handles connection pooling effectively for warm starts.
// mongoose
//   .connect(process.env.MONG_URI, {
//     useNewUrlParser: true, // Deprecated, but harmless if used
//     useUnifiedTopology: true, // Deprecated, but harmless if used
//     serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
//     socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
//   })
//   .then(() => {
//     console.log("MongoDB connected successfully");
//     // Only start the Express server for local development, Vercel handles this.
//     if (process.env.NODE_ENV !== "production") {
//       const PORT = process.env.PORT || 5000; // Use a different port for backend locally if frontend runs on 3000
//       app.listen(PORT, () => {
//         console.log(`Local server listening on ${PORT}`);
//       });
//     }
//   })
//   .catch((error) => {
//     console.error("MongoDB connection error:", error);
//     // In a serverless function, you might not want to exit the process
//     // but rather handle the error for the current request.
//     // For local dev, process.exit(1) or similar might be useful.
//   });

// // --- IMPORTANT: Export the Express app for Vercel ---
// module.exports = app;

// api/index.js (This file will be deployed to Vercel)

// Ensure dotenv is loaded very early for local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path"); // Keep for path.join if needed
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const multer = require("multer");

const app = express();

// --- START: ADDED DEBUGGING CODE ---
const fs = require("fs");
const util = require("util");

const readDir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

async function listDirectory(dirPath, indent = "") {
  try {
    const files = await readDir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        console.log(`${indent}├── ${file}/`);
        await listDirectory(filePath, indent + "│   ");
      } else {
        console.log(`${indent}├── ${file}`);
      }
    }
  } catch (e) {
    console.error(`${indent}Error listing ${dirPath}:`, e.message);
  }
}

async function performStartupDebug() {
  console.log("--- Vercel Serverless Function Cold Start Debug ---");
  console.log("Current working directory (process.cwd()):", process.cwd());
  console.log("Directory of this file (__dirname):", __dirname);

  console.log("--- Listing /var/task/ contents (Function Root) ---");
  await listDirectory("/var/task/");
  console.log("--- Finished listing /var/task/ contents ---");

  // Attempt to list controllers explicitly to confirm presence
  console.log("--- Listing /var/task/controllers/ contents ---");
  try {
    await listDirectory("/var/task/controllers/");
  } catch (e) {
    console.error("Could not list /var/task/controllers/:", e.message);
  }
  console.log("--- Finished listing /var/task/controllers/ contents ---");

  console.log(
    "--- Attempting direct require of paintingController from api/index.js ---"
  );
  try {
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
const paintingRoutes = require("../routes/paintings");
const authRoutes = require("../routes/auth");

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
