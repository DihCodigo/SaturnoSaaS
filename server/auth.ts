import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET!;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

export function generateToken(payload: { id: string; role: string; companyId?: string | null }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export interface AuthRequest extends Request {
  user?: { id: string; role: string; companyId?: string | null };
}

export function authMiddleware(roles?: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token nao fornecido" });
    }
    try {
      const decoded = verifyToken(authHeader.split(" ")[1]);
      req.user = decoded;
      if (roles && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      next();
    } catch {
      return res.status(401).json({ message: "Token invalido" });
    }
  };
}
