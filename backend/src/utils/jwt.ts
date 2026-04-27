import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export function signAuthToken(userId: number): string {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign({ sub: userId }, secret, options);
}
