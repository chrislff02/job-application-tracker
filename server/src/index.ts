import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import { authenticateToken, AuthRequest } from "./middleware/auth";
import applicationRoutes from "./routes/applications";
import dashboardRoutes from "./routes/dashboard";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    message: "Job Application Tracker API is running",
  });
});

app.get(
  "/api/protected",
  authenticateToken,
  (req: AuthRequest, res) => {
    res.json({
      message: "You can access this protected route",
      user: req.user,
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
