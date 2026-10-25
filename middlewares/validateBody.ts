import type { NextFunction, Request, Response } from "express";
import * as z from "zod";

export const validateBody = (schema: z.ZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = schema.safeParse(req.body);

      if (!body.success) {
        req.log.warn(
          {
            errors: body.error.issues,
          },
          "Invalid request body",
        );
        return res.status(400).json({
          message: "Invalid Request body",
          errors: body.error.issues.map((error) => error.message),
        });
      }
      req.body = body.data;
      next();
    } catch (e) {
      req.log.error(e, "Error validating request body");
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  };
};
