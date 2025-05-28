const express = require("express");
const router = express.Router();

const paintingController = require("../controllers/paintingController");

// --- Define Routes ---

// Post Method (e.g., POST /painting/post)
router.post("/", paintingController.postPainting);

// Get All Method (e.g., GET /painting/getAll)
router.get("/", paintingController.getAllPaintings);

// Get by ID Method (e.g., GET /painting/getOne/123)
router.get(
  "/:id",
  paintingController.getPaintingMiddleware,
  paintingController.getPaintingById
);

// Update by ID Method (e.g., PATCH /painting/update/123)
router.patch("/:id", paintingController.updatePaintingById);

// Delete by ID Method (e.g., DELETE /painting/delete/123)
router.delete("/:id", paintingController.deletePaintingById);

module.exports = router;
