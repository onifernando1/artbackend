const Painting = require("../models/Painting");

exports.postPainting = async (req, res) => {
  console.log("Received request body:", req.body); // ADD THIS LINE TEMPORARILY

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
    res.json(paintings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPaintingById = (req, res) => {
  const id = req.params.id; // Get the ID from the URL parameter
  console.log(`GET request received for /painting/getOne/${id}`);
  res.status(200).json({
    message: `Get by ID API - Painting with ID ${id} retrieved (placeholder)`,
  });
};

exports.updatePaintingById = (req, res) => {
  const id = req.params.id; // Get the ID from the URL parameter
  console.log(`PATCH request received for /painting/update/${id}`);
  res.status(200).json({
    message: `Update by ID API - Painting with ID ${id} updated (placeholder)`,
  });
};

exports.deletePaintingById = (req, res) => {
  const id = req.params.id; // Get the ID from the URL parameter
  console.log(`DELETE request received for /painting/delete/${id}`);
  res.status(200).json({
    message: `Delete by ID API - Painting with ID ${id} deleted (placeholder)`,
  });
};
