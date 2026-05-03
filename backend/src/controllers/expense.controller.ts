import { Request, Response } from "express";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense
} from "../services/expense.service";
import {
  createExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
  updateExpenseSchema
} from "../validations/expense.validation";
import { HttpError } from "../utils/http-error";

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
  const expense = await createExpense(userId, payload);
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
  const payload = updateExpenseSchema.parse(req.body);
  const expense = await updateExpense(userId, id, payload);
  res.status(200).json(expense);
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
