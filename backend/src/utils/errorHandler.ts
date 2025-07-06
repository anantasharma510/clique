import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errorId?: string;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public errorId: string;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorId = crypto.randomUUID();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const generateErrorId = (): string => {
  return crypto.randomUUID();
};

export const logError = (error: AppError, req?: Request): void => {
  const errorContext = {
    errorId: error.errorId,
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    userId: (req as any)?.user?._id,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip,
    timestamp: new Date().toISOString()
  };

  console.error('[ERROR]', JSON.stringify(errorContext, null, 2));
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  error.statusCode = error.statusCode || 500;
  error.errorId = error.errorId || generateErrorId();

  // Log error
  logError(error, req);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    message: error.isOperational 
      ? error.message 
      : 'Internal server error',
    errorId: isDevelopment ? error.errorId : undefined,
    ...(isDevelopment && { stack: error.stack })
  };

  res.status(error.statusCode).json(errorResponse);
};

export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 