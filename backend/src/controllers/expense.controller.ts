import path from "node:path";
import { Request, Response } from "express";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
  type UpdateExpenseServiceInput
} from "../services/expense.service";
import {
  createExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
  updateExpenseSchema
} from "../validations/expense.validation";
import { HttpError } from "../utils/http-error";
import {
  finalizeReceiptUpload,
  resolveReceiptAbsolutePath
} from "../utils/receipt-storage";
import { Expense } from "../models";

function getUserIdFromRequest(req: Request): number {
  if (!req.userId) {
    throw new HttpError(401, "Unauthorized.");
  }
  return req.userId;
}

export async function createExpenseController(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getUserIdFromRequest(req);
  const payload = createExpenseSchema.parse(req.body);

  const displayName =
    payload.receiptName ??
    (req.file ? path.basename(req.file.originalname) : null);

  let expense = await createExpense(userId, {
    ...payload,
    receiptName: displayName
  });

  if (req.file) {
    try {
      await finalizeReceiptUpload({
        userId,
        expenseId: expense.id,
        tempPath: req.file.path,
        mimeType: req.file.mimetype
      });
    } catch (error) {
      await expense.destroy();
      throw error;
    }

    await expense.update({
      receiptMimeType: req.file.mimetype
    });

    expense = await expense.reload();
  }

  res.status(201).json(expense);
}

export async function listExpensesController(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getUserIdFromRequest(req);
  const query = listExpensesQuerySchema.parse(req.query);
  const result = await listExpenses(userId, query);
  res.status(200).json(result);
}

export async function updateExpenseController(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getUserIdFromRequest(req);
  const { id } = expenseIdParamSchema.parse(req.params);
  const parsed = updateExpenseSchema.parse(req.body);

  const merged: UpdateExpenseServiceInput = { ...parsed };

  if (req.file) {
    await finalizeReceiptUpload({
      userId,
      expenseId: id,
      tempPath: req.file.path,
      mimeType: req.file.mimetype
    });
    merged.receiptMimeType = req.file.mimetype;
    if (merged.receiptName === undefined) {
      merged.receiptName = path.basename(req.file.originalname);
    }
  }

  const expense = await updateExpense(userId, id, merged);
  res.status(200).json(expense);
}

export async function getExpenseReceiptController(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getUserIdFromRequest(req);
  const { id } = expenseIdParamSchema.parse(req.params);
  const expense = await Expense.findOne({
    where: { id, userId }
  });

  if (!expense) {
    throw new HttpError(404, "Expense not found.");
  }

  const absolutePath = await resolveReceiptAbsolutePath(expense);

  if (!absolutePath || !expense.receiptMimeType) {
    throw new HttpError(
      404,
      "No receipt file is stored for this expense (only an optional filename)."
    );
  }

  const downloadNameRaw = expense.receiptName ?? "receipt";
  const downloadName =
    downloadNameRaw.replace(/^.*[/\\]/, "").replace(/["\r\n]/g, "_") ||
    "receipt";

  res.setHeader("Content-Type", expense.receiptMimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(downloadName)}"`
  );

  res.sendFile(path.resolve(absolutePath));
}

export async function deleteExpenseController(
  req: Request,
  res: Response
): Promise<void> {
  const userId = getUserIdFromRequest(req);
  const { id } = expenseIdParamSchema.parse(req.params);
  await deleteExpense(userId, id);
  res.status(204).send();
}
