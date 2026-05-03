import { Router } from "express";
import { authRouter } from "./auth.routes";
import { expenseRouter } from "./expense.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/expenses", expenseRouter);

export { apiRouter };
