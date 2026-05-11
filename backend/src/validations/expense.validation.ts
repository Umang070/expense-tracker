import { z } from "zod";

const categories = [
  "Petrol/Gas",
  "Car EMI",
  "Food",
  "Grocery",
  "Restaurant",
  "Utilities",
  "Rent",
  "Entertainment",
  "Healthcare",
  "Transport",
  "Education",
  "Shopping",
  "Others"
] as const;

const paymentMethods = [
  "Cash",
  "Debit Card",
  "Credit Card",
  "UPI",
  "Bank Transfer",
  "Net Banking"
] as const;

const optionalReceiptName = z
  .union([z.string(), z.literal(""), z.undefined(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return null;
    const s = String(v).trim().slice(0, 255);
    return s.length === 0 ? null : s;
  });

export const createExpenseSchema = z.object({
  amount: z.coerce.number().positive("Amount is required."),
  category: z.enum(categories, { error: "Category is required." }),
  paymentMethod: z.enum(paymentMethods, {
    error: "Payment method is required."
  }),
  description: z.string().trim().max(500).optional().default(""),
  date: z.string().date("Date is required."),
  receiptName: optionalReceiptName
});

export const updateExpenseSchema = z
  .object({
    amount: z.coerce.number().positive("Amount must be greater than zero.").optional(),
    category: z.enum(categories).optional(),
    paymentMethod: z.enum(paymentMethods).optional(),
    description: z.string().trim().max(500).optional(),
    date: z.string().date("Date is invalid.").optional(),
    receiptName: optionalReceiptName
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update."
  });

export const expenseIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid expense id.")
});

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
