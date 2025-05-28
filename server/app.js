const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 3000;

const paintingRoute = require("../routes/Painting");

app.use("/painting", paintingRoute);

app.get("/", (req, res) => res.send("Hello, world!"));

//Connect to DB
mongoose
  .connect(process.env.MONG_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
