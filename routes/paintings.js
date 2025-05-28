const express = require("express");
const router = express.Router();

const paintingController = require("../controllers/paintingController");

// --- Define Routes ---

// IMPORTANT: Specific routes must come BEFORE general (parameterized) routes.

// 1. Reorder Paintings (most specific PATCH route)
router.patch("/reorder", paintingController.reorderPaintings); // MOVED THIS HERE!

// 2. Post Method (e.g., POST /painting)
router.post("/", paintingController.createPainting);

// 3. Get All Method (e.g., GET /painting)
router.get("/", paintingController.getAllPaintings);

// 4. Get, Update, and Delete by ID Methods (general, use :id parameter)
// These routes use the getPaintingMiddleware to fetch a specific painting.
router.get(
  "/:id",
  paintingController.getPaintingMiddleware,
  paintingController.getPaintingById
);
router.patch(
  "/:id",
  paintingController.getPaintingMiddleware,
  paintingController.updatePaintingById
);
router.delete(
  "/:id",
  paintingController.getPaintingMiddleware,
  paintingController.deletePaintingById
);

module.exports = router;
