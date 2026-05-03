import { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { HttpError } from "../utils/http-error";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authorization token is missing.");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = verifyAuthToken(token);
    req.userId = decoded.sub;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired authorization token.");
  }
}
