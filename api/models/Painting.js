const mongoose = require("mongoose");

const paintingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Painting name is required"], // Name is mandatory
    trim: true, // Remove whitespace from both ends of a string
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
  },
  medium: {
    type: String,
    required: [true, "Medium is required"],
    trim: true,
  },
  size: {
    type: String,
    required: [true, "Size is required"],
    trim: true,
  },
  colour: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    required: [true, "Order is required"], // Useful for display order in a gallery
    min: [0, "Order number cannot be negative"],
  },
  imageUrl: {
    type: String,
    required: [true, "Image URL is required"],
    trim: true,
    // ... (validation) ...
  },
  publicId: {
    // Add this field
    type: String,
    // Not required if a painting might not have an image initially, but recommended if it always will
    // required: [true, 'Cloudinary Public ID is required']
  },
});

module.exports = mongoose.model("Painting", paintingSchema);
