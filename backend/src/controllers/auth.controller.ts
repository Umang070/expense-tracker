import { Request, Response } from "express";
import { login, register } from "../services/auth.service";
import { loginSchema, registerSchema } from "../validations/auth.validation";

export async function registerController(req: Request, res: Response): Promise<void> {
  const payload = registerSchema.parse(req.body);
  const result = await register(payload);
  res.status(201).json(result);
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const payload = loginSchema.parse(req.body);
  const result = await login(payload);
  res.status(200).json(result);
}
