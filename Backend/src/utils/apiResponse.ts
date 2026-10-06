import type { Response } from "express";

type Meta = Record<string, unknown>;

export function sendSuccess<T>(res: Response, data: T, message = "OK", statusCode = 200, meta?: Meta) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {})
  });
}
