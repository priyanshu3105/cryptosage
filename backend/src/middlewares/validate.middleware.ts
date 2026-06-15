import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { AppError } from "../utils/appError";

type ValidationSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        Object.assign(req.params, schema.params.parse(req.params));
      }
      if (schema.query) {
        Object.assign(req.query, schema.query.parse(req.query));
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message ?? "Invalid request";
        next(new AppError(400, "VALIDATION_ERROR", message));
        return;
      }

      next(error);
    }
  };
}
