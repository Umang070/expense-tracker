import { Router } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createExpenseController,
  deleteExpenseController,
  listExpensesController,
  updateExpenseController
} from "../controllers/expense.controller";

const expenseRouter = Router();

expenseRouter.use(authMiddleware);

expenseRouter.get("/", asyncHandler(listExpensesController));
expenseRouter.post("/", asyncHandler(createExpenseController));
expenseRouter.put("/:id", asyncHandler(updateExpenseController));
expenseRouter.delete("/:id", asyncHandler(deleteExpenseController));

export { expenseRouter };
