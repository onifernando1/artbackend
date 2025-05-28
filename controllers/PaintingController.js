const Painting = require("../models/Painting");

exports.postPainting = (req, res) => {
  console.log("POST request received for /painting/post");
  res
    .status(201)
    .json({ message: "Post API - Painting created (placeholder)" });
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
