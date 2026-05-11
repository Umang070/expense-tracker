import { Router } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createExpenseController,
  deleteExpenseController,
  getExpenseReceiptController,
  listExpensesController,
  updateExpenseController
} from "../controllers/expense.controller";
import { maybeReceiptUpload } from "../middlewares/maybe-receipt-upload.middleware";

const expenseRouter = Router();

expenseRouter.use(authMiddleware);

expenseRouter.get("/", asyncHandler(listExpensesController));
expenseRouter.post(
  "/",
  maybeReceiptUpload,
  asyncHandler(createExpenseController)
);
expenseRouter.get(
  "/:id/receipt",
  asyncHandler(getExpenseReceiptController)
);
expenseRouter.put(
  "/:id",
  maybeReceiptUpload,
  asyncHandler(updateExpenseController)
);
expenseRouter.delete("/:id", asyncHandler(deleteExpenseController));

export { expenseRouter };
