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

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", interviewRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    message: "Job Application Tracker API is running",
  });
});

app.get("/api/protected", authenticateToken, (req: AuthRequest, res) => {
  res.json({
    message: "You can access this protected route",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
