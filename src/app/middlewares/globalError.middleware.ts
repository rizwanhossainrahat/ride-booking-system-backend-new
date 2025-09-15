import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import mongoose from "mongoose";
import { AppError } from "../../config/errors/App.error";
import { isZodError, parseZodError } from "../utils/middleware.util";
import { ErrorResponsePayload } from "../utils/types.util";

// Define custom error interfaces
interface ZodIssue {
  path?: string[];
  field?: string;
  message?: string;
  code?: string;
}

interface CustomIssue {
  path?: string[];
  message?: string;
}

interface ZodError {
  name: string;
  message: string;
  stack?: string;
  issues: ZodIssue[];
}

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  keyPattern?: Record<string, number>;
}

interface CustomError extends Error {
  statusCode?: number;
  path?: string;
  value?: string;
  errors?: Record<string, unknown>;
}

export const globalErrorResponse = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = httpStatus.BAD_REQUEST;
  let message = "Something went wrong";
  let stack: string | undefined;

  // Handle Zod errors
  if (isZodError(error)) {
    const zodError = error as ZodError;
    const fieldIssues: ZodIssue[] = parseZodError(zodError);
    let customIssues: CustomIssue[] = [];
    
    try {
      customIssues = JSON.parse(zodError.message) || [];
    } catch (e) {
      customIssues = [];
    }

    // Get the first available field name from either path or field
    const fieldName = customIssues[0]?.path?.[0] ?? 
                     fieldIssues[0]?.field ?? 
                     'unknown_field';

    // Get the first available error message
    const errorMessage = fieldIssues[0]?.message ?? 
                        customIssues[0]?.message ?? 
                        "Validation error";

    message = `Validation error on field '${fieldName}': ${errorMessage}`;

    return res.status(httpStatus.BAD_REQUEST).json({
      name: zodError.name || "ZodError",
      message,
      status: httpStatus.BAD_REQUEST,
      success: false,
      errors: customIssues.length ? customIssues : fieldIssues,
      ...(process.env.NODE_ENV === "development" && { stack: zodError.stack }),
    });
  }

  // Handle Mongoose CastError
  if (error instanceof mongoose.Error.CastError) {
    message = `Invalid value for '${error.path}': ${error.value}`;
    statusCode = httpStatus.BAD_REQUEST;
  }
  // Handle Mongoose ValidationError
  else if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    message = `Validation failed on ${errors.length} field(s).`;
    return res.status(httpStatus.BAD_REQUEST).json({
      name: "MongooseValidationError",
      message,
      status: httpStatus.BAD_REQUEST,
      success: false,
      errors,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
  // Handle MongoDB duplicate key errors
  else if (isMongoDuplicateError(error)) {
    const mongoError = error as MongoError;
    const dupFields = Object.keys(mongoError.keyValue || {});
    message = `Duplicate field value: ${dupFields.join(", ")}. Please use another value.`;
    statusCode = httpStatus.CONFLICT;
  }
  // Handle custom AppError
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    stack = error.stack;
  }
  // Handle general Error objects
  else if (error instanceof Error) {
    const customError = error as CustomError;
    message = error.message;
    stack = error.stack;
    statusCode = customError.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  }
  // Fallback for unknown errors
  else {
    message = "An unexpected error occurred.";
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }

  console.error(error);

  // Build response
  const responsePayload: ErrorResponsePayload = {
    name: (error as Error).name || "Error",
    message,
    status: statusCode,
    success: false,
  };

  if (process.env.NODE_ENV === "development") {
    if (stack) {
      responsePayload.stack = stack;
    } else if ((error as Error).stack) {
      responsePayload.stack = (error as Error).stack;
    }
  }

  return res.status(statusCode).json(responsePayload);
};

// Helper function to check for MongoDB duplicate errors
function isMongoDuplicateError(error: unknown): error is MongoError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as MongoError).code === 11000
  );
}