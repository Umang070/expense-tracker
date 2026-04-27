import { Router } from "express";
import { asyncHandler } from "../middlewares/async-handler";
import { loginController, registerController } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/register", asyncHandler(registerController));
authRouter.post("/login", asyncHandler(loginController));

export { authRouter };
