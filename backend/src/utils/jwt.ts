import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export function signAuthToken(userId: number): string {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign({ sub: userId }, secret, options);
}

export function verifyAuthToken(token: string): { sub: number } {
  const secret: Secret = env.JWT_SECRET;
  const payload = jwt.verify(token, secret) as { sub?: string | number };

  if (payload.sub === undefined) {
    throw new Error("Token payload is invalid.");
  }

  return {
    sub: Number(payload.sub)
  };
}
