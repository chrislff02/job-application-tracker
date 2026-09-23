import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import applicationRoutes from "./routes/applications";
import dashboardRoutes from "./routes/dashboard";
import interviewRoutes from "./routes/interviews";

import { authenticateToken, AuthRequest } from "./middleware/auth";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

const CLIENT_URL = process.env.CLIENT_URL;

if (!CLIENT_URL) {
  throw new Error("CLIENT_URL is not configured");
}

// Only allow requests from configured frontend origin
// CLIENT_URL should be set to the deployed frontend URL
app.use(
  cors({
    origin: CLIENT_URL,
  }),
);

// Parse incoming JSON request bodies
app.use(express.json());

// API route groups
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", interviewRoutes);

// Simple health check to confirm that the API is running
app.get("/api/health", (req, res) => {
  res.json({
    message: "Job Application Tracker API is running",
  });
});

// Small protected endpoint to verify authentication
app.get("/api/protected", authenticateToken, (req: AuthRequest, res) => {
  res.json({
    message: "You can access this protected route",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
