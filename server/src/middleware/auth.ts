import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AuthPayload {
  userId: number;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication token required",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: "JWT_SECRET is not configured",
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
