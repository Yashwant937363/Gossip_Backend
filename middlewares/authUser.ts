import type { NextFunction, Request, Response } from "express";
import type { JWTPayload } from "../schema/auth-schema.js";
import { verifyToken } from "../services/jwt-service.js";

const authUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if (token === undefined) {
      req.log.warn("Unauthorized access attempt: Missing token");
      return res.status(401).json({ message: "unauthorized" });
    }

    const result = verifyToken<JWTPayload>(token);
    res.locals.id = result;
    next();
  } catch (e) {
    req.log.warn({ err: e }, "Unauthorized access attempt: Invalid token");
    return res.status(401).json({ message: "unauthorized" });
  }
};

export default authUser;
