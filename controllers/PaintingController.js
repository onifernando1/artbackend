const Painting = require("../models/Painting");

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

exports.postPainting = async (req, res) => {
  const painting = new Painting({
    name: req.body.name,
    category: req.body.category,
    medium: req.body.medium,
    size: req.body.size,
    colour: req.body.colour,
    order: req.body.order,
    imageUrl: req.body.imageUrl,
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
  const { name, category, medium, size, colour, order, imageUrl } = req.body;

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
  if (imageUrl != null) {
    req.painting.imageUrl = imageUrl;
  }

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
    await req.painting.deleteOne();

    res.status(200).json({ message: "Painting deleted successfully" });
  } catch (err) {
    console.error("Error deleting painting:", err);
    res.status(500).json({
      message: "An internal server error occurred while deleting the painting.",
    });
  }
};
