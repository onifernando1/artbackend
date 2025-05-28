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
    required: [true, "Image URL is required"], // The URL from your cloud storage (e.g., Cloudinary, AWS S3)
    trim: true,
    // validate: {
    //   validator: function (v) {
    //     // Basic URL validation (you might want a more robust regex for production)
    //     return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v);
    //   },
    //   message: (props) => `${props.value} is not a valid URL!`,
    // },
  },
});
