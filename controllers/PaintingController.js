// /Users/onifernando/repos/artbackend/controllers/paintingController.js

const Painting = require("../models/Painting");
const cloudinary = require("cloudinary").v2; // Make sure cloudinary is configured in your app.js

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

// --- FIX START ---
exports.createPainting = async (req, res, next) => {
  // Added 'next' for error handling
  try {
    // 1. Get text fields from req.body (parsed by multer)
    // 2. Get the file from req.file (parsed by multer)
    const { name, category, medium, size, colour, order } = req.body;
    const imageFile = req.file; // This is the file object from multer

    if (!imageFile) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    // Convert buffer to data URI for Cloudinary upload
    const b64 = Buffer.from(imageFile.buffer).toString("base64");
    const dataURI = "data:" + imageFile.mimetype + ";base64," + b64;

    let cloudinaryResponse;
    try {
      // Upload the image to Cloudinary
      cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
        folder: `shriti-art/${category.toLowerCase()}`, // Consider making folder names consistent and lowercase
        public_id: `${name.toLowerCase().replace(/\s/g, "-")}-${Date.now()}`, // Unique public ID
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary upload failed:", cloudinaryError);
      return res.status(500).json({
        message:
          "Failed to upload image to Cloudinary. Please check Cloudinary configuration or network.",
      });
    }

    // Ensure Cloudinary returned a valid URL
    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      console.error(
        "Cloudinary response missing secure_url:",
        cloudinaryResponse
      );
      return res.status(500).json({
        message: "Cloudinary upload succeeded, but no image URL was returned.",
      });
    }

    // Create the new Painting instance with data from req.body and Cloudinary response
    const painting = new Painting({
      name,
      category,
      medium,
      size,
      colour,
      order: parseInt(order, 10), // Ensure order is an integer
      imageUrl: cloudinaryResponse.secure_url, // Use the URL from Cloudinary
      publicId: cloudinaryResponse.public_id, // Use the public_id from Cloudinary
      // user: req.user.id, // Uncomment if your auth middleware sets req.user
    });

    const newPainting = await painting.save();
    res.status(201).json(newPainting); // Return the created painting
  } catch (err) {
    console.error("Error creating painting:", err);
    // If it's a Mongoose validation error, provide more detail
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    next(err); // Pass any other errors to the global error handler
  }
};
// --- FIX END ---

exports.getAllPaintings = async (req, res) => {
  try {
    const query = {};

    if (req.query.category) {
      query.category = req.query.category;
    }

    const paintings = await Painting.find(query).sort({ order: 1 });

    res.status(200).json(paintings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPaintingById = (req, res) => {
  res.status(200).json(req.painting);
};

exports.updatePaintingById = async (req, res, next) => {
  // Added 'next'
  // When updating, if a new image is sent, it will be in req.file.
  // The client should send the new image data, not pre-uploaded Cloudinary URLs/IDs.
  // This update logic needs to account for that.

  const { name, category, medium, size, colour, order } = req.body;
  const newImageFile = req.file; // This will be present if a new file was uploaded for update

  try {
    // --- Handle image update ---
    if (newImageFile) {
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
          // Log and proceed; deletion of old image shouldn't block the new update
        }
      }

      // 2. Upload the NEW image to Cloudinary
      const b64 = Buffer.from(newImageFile.buffer).toString("base64");
      const dataURI = "data:" + newImageFile.mimetype + ";base64," + b64;

      let cloudinaryResponse;
      try {
        cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
          folder: `shriti-art/${
            category
              ? category.toLowerCase()
              : req.painting.category.toLowerCase()
          }`, // Use new category or old
          public_id: `${(name || req.painting.name)
            .toLowerCase()
            .replace(/\s/g, "-")}-${Date.now()}`,
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary re-upload failed:", cloudinaryError);
        return res
          .status(500)
          .json({ message: "Failed to re-upload new image to Cloudinary." });
      }

      if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
        console.error(
          "Cloudinary re-upload response missing secure_url:",
          cloudinaryResponse
        );
        return res
          .status(500)
          .json({
            message: "New image upload succeeded, but no URL was returned.",
          });
      }

      // 3. Update painting document with NEW image details
      req.painting.imageUrl = cloudinaryResponse.secure_url;
      req.painting.publicId = cloudinaryResponse.public_id;
    }
    // else if the client sent imageUrl and publicId in req.body, but no file.
    // This scenario is common if you have separate fields for image URL/ID directly
    // and the client is not re-uploading a new file but just changing the URL.
    // However, with file uploads, the common pattern is to re-upload.
    // If you intend for `imageUrl` and `publicId` in `req.body` to *directly* update
    // without a new file upload, then you would keep that part of your old logic.
    // For now, I'm assuming image updates ONLY happen via file upload.

    // --- Update other painting fields ---
    // Only update if the field is provided in the request body
    if (name !== undefined && name !== null) {
      // Check for explicit undefined/null
      req.painting.name = name;
    }
    if (category !== undefined && category !== null) {
      req.painting.category = category;
    }
    if (medium !== undefined && medium !== null) {
      req.painting.medium = medium;
    }
    if (size !== undefined && size !== null) {
      req.painting.size = size;
    }
    if (colour !== undefined && colour !== null) {
      req.painting.colour = colour;
    }
    if (order !== undefined && order !== null) {
      req.painting.order = parseInt(order, 10); // Ensure order is parsed
    }

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
    next(err); // Pass to global error handler
  }
};

exports.deletePaintingById = async (req, res, next) => {
  // Added 'next'
  try {
    if (req.painting.publicId) {
      try {
        await cloudinary.uploader.destroy(req.painting.publicId);
        console.log(`Image ${req.painting.publicId} deleted from Cloudinary.`);
      } catch (destroyErr) {
        console.error("Error deleting image from Cloudinary:", destroyErr);
        // Log the error, but still proceed to delete the painting document
      }
    }

    await req.painting.deleteOne();

    res
      .status(200)
      .json({ message: "Painting and associated image deleted successfully" });
  } catch (err) {
    console.error("Error deleting painting:", err);
    next(err); // Pass to global error handler
  }
};

exports.reorderPaintings = async (req, res, next) => {
  // Added 'next'
  console.log("--- REORDER PAINTINGS ENDPOINT HIT ---");
  console.log("Received request body:", JSON.stringify(req.body, null, 2));

  const updates = req.body;

  if (
    !Array.isArray(updates) ||
    updates.some((item) => !item._id || typeof item.order === "undefined")
  ) {
    console.log("Invalid request body detected.");
    return res.status(400).json({
      message:
        "Invalid request body. Expected an array of objects with _id and order.",
    });
  }

  try {
    const updatePromises = updates.map((update) => {
      console.log(
        `Attempting to update ID: ${update._id} with order: ${update.order}`
      );
      return Painting.findByIdAndUpdate(
        update._id,
        { order: update.order },
        { new: true, runValidators: true }
      );
    });

    const updatedPaintings = await Promise.all(updatePromises);

    if (updatedPaintings.some((doc) => doc === null)) {
      console.warn(
        "Some paintings were not found during reorder update. IDs might be incorrect."
      );
    }

    console.log(
      "All updates completed. Updated paintings:",
      updatedPaintings.filter((doc) => doc !== null).length
    );
    res.status(200).json({
      message: "Painting order updated successfully.",
      updatedCount: updatedPaintings.filter((doc) => doc !== null).length,
    });
  } catch (err) {
    console.error("Error in reorderPaintings catch block:", err);
    // Use next(err) to pass errors to your global error handler
    next(err);
  }
};
