import path from "node:path";
import fs from "node:fs/promises";

export const RECEIPT_ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const RECEIPT_ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"] as const;

function extFromMime(mime: string): string | null {
  const normalized = mime.replace(/\s+/g, "").toLowerCase();
  const map: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
  };
  return map[normalized] ?? null;
}

export function uploadsReceiptRoot(): string {
  return path.join(process.cwd(), "uploads", "receipts");
}

export function receiptRelativeSlug(userId: number, expenseId: number): string {
  return `${userId}_${expenseId}`;
}

export function receiptAbsolutePathForMime(
  userId: number,
  expenseId: number,
  mimeType: string,
): string | null {
  const ext = extFromMime(mimeType);
  if (!ext) {
    return null;
  }
  return path.join(
    uploadsReceiptRoot(),
    `${receiptRelativeSlug(userId, expenseId)}${ext}`,
  );
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(uploadsReceiptRoot(), { recursive: true });
}

async function unlinkAllReceiptVariants(userId: number, expenseId: number): Promise<void> {
  const slug = receiptRelativeSlug(userId, expenseId);
  const root = uploadsReceiptRoot();
  for (const ext of RECEIPT_ALLOWED_EXTENSIONS) {
    const filePath = path.join(root, `${slug}${ext}`);
    await fs.unlink(filePath).catch(() => undefined);
  }
}

/** Move tempfile into place; clears any existing receipt binaries for this expense first. */
export async function finalizeReceiptUpload(params: {
  userId: number;
  expenseId: number;
  tempPath: string;
  mimeType: string;
}): Promise<void> {
  const destination = receiptAbsolutePathForMime(
    params.userId,
    params.expenseId,
    params.mimeType,
  );
  if (!destination) {
    throw new Error("Invalid receipt MIME type.");
  }

  await ensureDirs();
  await unlinkAllReceiptVariants(params.userId, params.expenseId);

  await fs.rename(params.tempPath, destination);
}

export async function unlinkReceiptVariantsFromDisk(params: {
  userId: number;
  expenseId: number;
}): Promise<void> {
  await unlinkAllReceiptVariants(params.userId, params.expenseId);
}

export async function resolveReceiptAbsolutePath(expense: {
  userId: number;
  id: number;
  receiptMimeType: string | null;
}): Promise<string | null> {
  if (!expense.receiptMimeType) {
    return null;
  }

  const abs = receiptAbsolutePathForMime(
    expense.userId,
    expense.id,
    expense.receiptMimeType,
  );
  if (!abs) {
    return null;
  }

  try {
    await fs.stat(abs);
    return abs;
  } catch {
    return null;
  }
}
