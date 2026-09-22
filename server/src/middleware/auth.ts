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

  // Protected requests should send:
  // Authorization: Bearer <token>
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication token required",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication token required",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  // JWT_SECRET is a server configuration requirement
  // If missing, authentication can't be performed safely
  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");

    return res.status(500).json({
      message: "Server authentication configuration error",
    });
  }

  try {
    // jwt.verify checks both signature & token expiration
    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;

    // Attach authenticated user's identity to the request so
    // downstream routes can scope database queries to user
    req.user = decoded;

    next();
  } catch {
    // Invalid signatures & expired tokens are both treated as
    // unauthenticated so frontend can handle them consistently
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
