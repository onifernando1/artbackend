const express = require("express");
const router = express.Router();

const controller = require("../controllers/PaintingController");

router.post("/", (req, res) => {
  res.send("You just create a painting");
});

router.get("/", controller.get);

module.exports = router;
