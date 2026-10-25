import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateToken = <T extends object>(payload: T): string => {
  return jwt.sign(payload, env.jwtSecret);
};

export const verifyToken = <T extends object>(token: string): T => {
  return jwt.verify(token, env.jwtSecret) as T;
};
