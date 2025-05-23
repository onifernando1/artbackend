const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

const paintingRoute = require("../routes/Painting");
app.use("/painting", paintingRoute);

app.get("/", (req, res) => res.send("Hello, world!"));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
