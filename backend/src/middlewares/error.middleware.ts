import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Receipt file is too large (max 10 MB)."
        : error.message;
    res.status(400).json({ message });
    return;
  }

  if (error instanceof Error && /receipt must be/i.test(error.message)) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    res.status(400).json({
      message: firstIssue?.message ?? "Validation failed."
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", error);

  const message =
    env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error.";

  res.status(500).json({
    message
  });
}
