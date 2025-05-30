// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // We need the User model to find the user by ID from the token

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in 'Authorization' header (Bearer Token format)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]; // Splits "Bearer TOKEN" into ["Bearer", "TOKEN"]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user to the request object (without the password)
      // We search for the user by the ID stored in the token payload
      req.user = await User.findById(decoded.id).select("-password"); // Exclude password from the user object

      if (!req.user) {
        // If user not found (e.g., deleted from DB after token issued)
        res.status(401).json({ message: "Not authorized, user not found" });
        return; // Stop execution
      }

      next(); // Move to the next middleware or route handler
    } catch (error) {
      console.error("Error in authMiddleware:", error);
      if (error.name === "TokenExpiredError") {
        res.status(401).json({ message: "Not authorized, token expired" });
      } else if (error.name === "JsonWebTokenError") {
        res.status(401).json({ message: "Not authorized, token failed" });
      } else {
        res.status(401).json({ message: "Not authorized, token invalid" });
      }
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

module.exports = { protect };
