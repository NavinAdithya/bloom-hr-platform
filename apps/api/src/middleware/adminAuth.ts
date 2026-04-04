import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; role: string; email?: string };
    }
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  const token =
    (req as Request).cookies?.[config.adminTokenCookieName] ??
    (req as Request).cookies?.["admin_token"];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret, { algorithms: ["HS256"] }) as { sub: string; role: string; email?: string };
    if (payload.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    req.admin = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

