const express = require("express");
const router = express.Router();

const controller = require("../controllers/PaintingController");

router.post("/", controller.post);

//getting one
router.get("/", controller.get);

module.exports = router;
