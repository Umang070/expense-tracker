import { Expense } from "../models";
import { HttpError } from "../utils/http-error";
import { unlinkReceiptVariantsFromDisk } from "../utils/receipt-storage";
import {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput
} from "../validations/expense.validation";

export type UpdateExpenseServiceInput = UpdateExpenseInput & {
  receiptMimeType?: string | null;
};

export async function createExpense(userId: number, input: CreateExpenseInput) {
  return Expense.create({
    userId,
    amount: input.amount,
    category: input.category,
    paymentMethod: input.paymentMethod,
    description: input.description || null,
    date: input.date,
    receiptName: input.receiptName ?? null,
    receiptMimeType: null
  });
}

export async function listExpenses(userId: number, query: ListExpensesQuery) {
  const offset = (query.page - 1) * query.limit;

  const result = await Expense.findAndCountAll({
    where: { userId },
    order: [["date", "DESC"], ["id", "DESC"]],
    limit: query.limit,
    offset
  });

  return {
    data: result.rows.map((row) => row.get({ plain: true })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.count,
      totalPages: Math.ceil(result.count / query.limit)
    }
  };
}

export async function updateExpense(
  userId: number,
  expenseId: number,
  input: UpdateExpenseServiceInput
) {
  const expense = await Expense.findOne({ where: { id: expenseId, userId } });
  if (!expense) {
    throw new HttpError(404, "Expense not found.");
  }

  await expense.update({
    amount: input.amount ?? expense.amount,
    category: input.category ?? expense.category,
    paymentMethod: input.paymentMethod ?? expense.paymentMethod,
    description: input.description ?? expense.description,
    date: input.date ?? expense.date,
    receiptName:
      input.receiptName === undefined ? expense.receiptName : input.receiptName,
    receiptMimeType:
      input.receiptMimeType === undefined
        ? expense.receiptMimeType
        : input.receiptMimeType
  });

  return expense.reload();
}

export async function deleteExpense(userId: number, expenseId: number) {
  const expense = await Expense.findOne({ where: { id: expenseId, userId } });
  if (!expense) {
    throw new HttpError(404, "Expense not found.");
  }

  await unlinkReceiptVariantsFromDisk({ userId: expense.userId, expenseId });

  await expense.destroy();
}
