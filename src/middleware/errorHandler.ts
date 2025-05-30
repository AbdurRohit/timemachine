import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Prisma database errors
  if (err.code === 'P2002') {
    res.status(409).json({
      error: 'Conflict',
      message: 'A record with this information already exists'
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested record was not found'
    });
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
    return;
  }

  // Custom application errors
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    res.status(err.statusCode).json({
      error: 'Client Error',
      message: err.message
    });
    return;
  }

  // Database connection errors
  if (err.message.includes('connect') || err.message.includes('database')) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection error'
    });
    return;
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack })
  });
};