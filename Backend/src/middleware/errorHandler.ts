import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== "production" && error instanceof Error ? { stack: error.stack } : {})
  });
}
