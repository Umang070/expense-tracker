import type { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { RECEIPT_ALLOWED_MIME } from "../utils/receipt-storage";

const tmpDir = path.join(process.cwd(), "uploads", "receipt-tmp");

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const receiptUpload = multer({
  dest: tmpDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (RECEIPT_ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Receipt must be a PDF or image (PNG, JPEG, WebP)."));
  },
});

export function maybeReceiptUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const raw = req.headers["content-type"];
  const ct = typeof raw === "string" ? raw : "";
  if (ct.toLowerCase().includes("multipart/form-data")) {
    receiptUpload.single("receipt")(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      next();
    });
    return;
  }
  next();
}
