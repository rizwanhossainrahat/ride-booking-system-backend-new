import { NextFunction, Request, Response } from "express";
import httpStatus from 'http-status-codes';
import { asyncHandler, responseFunction } from "../utils/controller.util";

export const globalNotFoundResponse = asyncHandler( async ( req: Request, res: Response, next: NextFunction ) =>
{
    responseFunction( res, {
        statusCode: httpStatus.NOT_FOUND,
        message: "Route not found!",
        data: null
    } );
} );

