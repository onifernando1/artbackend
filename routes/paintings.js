// routes/paintings.js
const express = require("express");
const router = express.Router();
const path = require("path"); // <--- ADD THIS LINE

// Fix the path to paintingController using path.join and __dirname
// __dirname refers to the directory of the current file (routes/paintings.js)
// We go up one level (..) from 'routes' and then into 'controllers'
const paintingController = require("../controllers/paintingController");

const { protect } = require("../middleware/authMiddleware"); // Path should be correct as it's a sibling directory

// ----------------------------------------------------------------------
// IMPORTANT: Route order matters! More specific paths MUST come before general ones.
// ----------------------------------------------------------------------

// 1. Reorder Paintings (most specific PATCH route)
router.patch("/reorder", protect, paintingController.reorderPaintings);

// 2. Create Painting (POST /painting)
router.post("/", protect, paintingController.createPainting);

// 3. Get All Paintings (GET /painting) - This typically does NOT need protection
router.get("/", paintingController.getAllPaintings);

// 4. Get, Update, and Delete by ID Methods (general, use :id parameter)
router.get(
  "/:id",
  paintingController.getPaintingMiddleware,
  paintingController.getPaintingById
);

router.patch(
  "/:id",
  protect,
  paintingController.getPaintingMiddleware,
  paintingController.updatePaintingById
);
router.delete(
  "/:id",
  protect,
  paintingController.getPaintingMiddleware,
  paintingController.deletePaintingById
);

module.exports = router;
