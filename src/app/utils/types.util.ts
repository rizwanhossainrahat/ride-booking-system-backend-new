import { NextFunction, Request, Response } from "express";
import { ILocation } from "../modules/user/user.interface";

export type AsyncHandlerType = ( req: Request, res: Response, next: NextFunction ) => Promise<void>;

export interface TMeta
{
    total: number;
}

export interface TResponse<T>
{
    statusCode: number;
    data: T;
    message: string;
    success?: boolean;
    meta?: TMeta
}

export interface ActiveDriver {
  driverId: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  location: ILocation;
  isApproved: boolean;
  avgRating: number;
  vehicleInfo?: object;
}

export type ParsedZodIssue = Record<string, string>;
export interface ErrorResponsePayload {
  name: string;
  message: string;
  status: number;
  success: boolean;
  stack?: string;
  errors?: Array<{
    field?: string;
    message?: string;
    path?: string[];
  }>;
}