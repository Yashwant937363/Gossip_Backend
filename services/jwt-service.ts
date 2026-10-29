import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateToken = <T extends object>(
  payload: T,
  secret: string = env.jwtSecret,
  options?: jwt.SignOptions,
): string => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = <T extends object>(
  token: string,
  secret: string = env.jwtSecret,
): T => {
  return jwt.verify(token, secret) as T;
};
