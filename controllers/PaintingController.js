const Painting = require("../models/Painting");
const cloudinary = require("cloudinary").v2;

async function getPaintingMiddleware(req, res, next) {
  let painting;
  try {
    painting = await Painting.findById(req.params.id);
    if (painting == null) {
      return res.status(404).json({ message: "Painting not found" });
    }
  } catch (err) {
    console.error("Error in getPaintingMiddleware:", err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid Painting ID format" });
    }
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }

  req.painting = painting;
  next();
}

exports.getPaintingMiddleware = getPaintingMiddleware;

exports.createPainting = async (req, res) => {
  const painting = new Painting({
    name: req.body.name,
    category: req.body.category,
    medium: req.body.medium,
    size: req.body.size,
    colour: req.body.colour,
    order: req.body.order,
    imageUrl: req.body.imageUrl,
    publicId: req.body.publicId,
  });
  try {
    const newPainting = await painting.save();
    res.status(201).json(newPainting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllPaintings = async (req, res) => {
  try {
    const paintings = await Painting.find();
    res.status(200).json(paintings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPaintingById = (req, res) => {
  res.status(200).json(req.painting);
};

exports.updatePaintingById = async (req, res) => {
  const { name, category, medium, size, colour, order, imageUrl, publicId } =
    req.body;

  // IMPORTANT: Handle image update and old image deletion
  // If a new imageUrl (and typically publicId) is provided in the request body,
  // it means the client wants to replace the image.
  if (
    imageUrl != null &&
    publicId != null &&
    req.painting.imageUrl !== imageUrl
  ) {
    // A new image URL and publicId were sent, and it's different from the current one.
    // This implies the client has uploaded a new image to Cloudinary and is providing its details.

    // 1. Delete the OLD image from Cloudinary (if one existed)
    if (req.painting.publicId) {
      try {
        await cloudinary.uploader.destroy(req.painting.publicId);
        console.log(`Old Cloudinary image deleted: ${req.painting.publicId}`);
      } catch (destroyErr) {
        console.error(
          `Failed to delete old Cloudinary image ${req.painting.publicId}:`,
          destroyErr
        );
        // Decide how critical this is:
        // If you want the update to fail if old image deletion fails: throw destroyErr;
        // Otherwise (recommended for robustness): just log and proceed.
      }
    }

    // 2. Update the painting document with the NEW image details
    req.painting.imageUrl = imageUrl;
    req.painting.publicId = publicId;
  } else if (imageUrl != null && req.painting.imageUrl !== imageUrl) {
    // Edge case: imageUrl provided but no publicId. This shouldn't happen if client uses your /upload/image endpoint correctly.
    // You might want to log a warning or return an error here.
    console.warn(
      "New imageUrl provided without publicId in update. Image deletion might be skipped."
    );
    req.painting.imageUrl = imageUrl;
  } else if (
    publicId != null &&
    req.painting.publicId !== publicId &&
    imageUrl == null
  ) {
    // Edge case: publicId provided but no imageUrl. This usually doesn't make sense for updates if they are paired.
    console.warn(
      "New publicId provided without imageUrl in update. This might be an issue."
    );
    req.painting.publicId = publicId;
  }

  // --- Update other painting fields (your existing logic) ---
  if (name != null) {
    req.painting.name = name;
  }
  if (category != null) {
    req.painting.category = category;
  }
  if (medium != null) {
    req.painting.medium = medium;
  }
  if (size != null) {
    req.painting.size = size;
  }
  if (colour != null) {
    req.painting.colour = colour;
  }
  if (order != null) {
    req.painting.order = order;
  }

  // --- Save the updated painting ---
  try {
    const updatedPainting = await req.painting.save();
    res.status(200).json(updatedPainting);
  } catch (err) {
    console.error("Error updating painting:", err);

    if (err.name === "ValidationError") {
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res.status(400).json({ message: "Validation failed", errors });
    }

    res.status(500).json({
      message: "An internal server error occurred while updating the painting.",
    });
  }
};

exports.deletePaintingById = async (req, res) => {
  try {
    // Check if there's an image associated and delete it from Cloudinary first
    if (req.painting.publicId) {
      try {
        await cloudinary.uploader.destroy(req.painting.publicId);
        console.log(`Image ${req.painting.publicId} deleted from Cloudinary.`);
      } catch (destroyErr) {
        console.error("Error deleting image from Cloudinary:", destroyErr);
        // Log the error, but still proceed to delete the painting document
        // as the core task is to remove the painting record.
      }
    }

    // Then, delete the painting document from MongoDB
    await req.painting.deleteOne();

    res
      .status(200)
      .json({ message: "Painting and associated image deleted successfully" });
  } catch (err) {
    console.error("Error deleting painting:", err);
    res.status(500).json({
      message: "An internal server error occurred while deleting the painting.",
    });
  }
};

exports.reorderPaintings = async (req, res) => {
  // req.body is expected to be an array like: [{ _id: 'abc', order: 0 }, { _id: 'xyz', order: 1 }]
  const updates = req.body;

  if (
    !Array.isArray(updates) ||
    updates.some((item) => !item._id || typeof item.order === "undefined")
  ) {
    return res
      .status(400)
      .json({
        message:
          "Invalid request body. Expected an array of objects with _id and order.",
      });
  }

  try {
    // Use a Promise.all to await all individual updates concurrently
    const updatePromises = updates.map((update) => {
      // Find the painting by its _id and update its 'order' field
      return Painting.findByIdAndUpdate(
        update._id,
        { order: update.order },
        { new: true, runValidators: true } // Return the updated doc, run schema validators
      );
    });

    // Await all updates to complete
    const updatedPaintings = await Promise.all(updatePromises);

    // Check if any paintings were not found/updated (optional, depends on strictness)
    if (updatedPaintings.some((doc) => doc === null)) {
      console.warn("Some paintings were not found during reorder update.");
      // You might return a partial success or a 404/400 for specific missing IDs
    }

    res
      .status(200)
      .json({
        message: "Painting order updated successfully.",
        updatedCount: updatedPaintings.length,
      });
  } catch (err) {
    console.error("Error reordering paintings:", err);

    // Handle specific validation errors if any occur during update
    if (err.name === "ValidationError") {
      const errors = {};
      for (let field in err.errors) {
        errors[field] = err.errors[field].message;
      }
      return res
        .status(400)
        .json({ message: "Validation failed during reorder", errors });
    }

    res
      .status(500)
      .json({
        message:
          "An internal server error occurred while reordering paintings.",
      });
  }
};
