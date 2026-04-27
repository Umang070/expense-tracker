import { AuthResponse } from "../types/auth.types";
import { User } from "../models";
import { LoginInput, RegisterInput } from "../validations/auth.validation";
import { comparePassword, hashPassword } from "../utils/password";
import { signAuthToken } from "../utils/jwt";
import { HttpError } from "../utils/http-error";

function toAuthResponse(user: User): AuthResponse {
  return {
    token: signAuthToken(user.id),
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await User.findOne({ where: { email: input.email } });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered.");
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: await hashPassword(input.password)
  });

  return toAuthResponse(user);
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ where: { email: input.email } });

  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const isValidPassword = await comparePassword(input.password, user.password);
  if (!isValidPassword) {
    throw new HttpError(401, "Invalid email or password.");
  }

  return toAuthResponse(user);
}
