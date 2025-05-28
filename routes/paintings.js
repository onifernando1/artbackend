// routes/paintings.js
const express = require("express");
const router = express.Router();

const paintingController = require("../controllers/paintingController");
const { protect } = require("../middleware/authMiddleware"); // NEW: Import the protect middleware

// ----------------------------------------------------------------------
// IMPORTANT: Route order matters! More specific paths MUST come before general ones.
// ----------------------------------------------------------------------

// 1. Reorder Paintings (most specific PATCH route)
// ADDED 'protect' middleware here
router.patch("/reorder", protect, paintingController.reorderPaintings);

// 2. Create Painting (POST /painting)
// ADDED 'protect' middleware here
router.post("/", protect, paintingController.createPainting);

// 3. Get All Paintings (GET /painting) - This typically does NOT need protection
router.get("/", paintingController.getAllPaintings);

// 4. Get, Update, and Delete by ID Methods (general, use :id parameter)
// ADDED 'protect' middleware to PATCH and DELETE
router.get(
  "/:id",
  paintingController.getPaintingMiddleware,
  paintingController.getPaintingById
); // GET by ID usually does NOT need protection (public viewing)

router.patch(
  "/:id",
  protect, // ADDED 'protect' middleware here
  paintingController.getPaintingMiddleware,
  paintingController.updatePaintingById
);
router.delete(
  "/:id",
  protect, // ADDED 'protect' middleware here
  paintingController.getPaintingMiddleware,
  paintingController.deletePaintingById
);

module.exports = router;
