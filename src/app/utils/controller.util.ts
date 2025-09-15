import { NextFunction, Request, Response } from "express";
import { AsyncHandlerType } from "./types.util";

export const asyncHandler = ( fn: AsyncHandlerType ) =>
    ( req: Request, res: Response, next: NextFunction ): Promise<void> =>
    {
        return Promise.resolve( fn( req, res, next ) ).catch( ( error: unknown ) =>
        {
            // console.error( error );
            next( error );
        } );
};

export interface TResponse<T> {
  message: string;
  statusCode: number;
  meta?: Record<string, unknown>;
  data?: T;
}

export const responseFunction = <T> ( res: Response, data: TResponse<T> ) =>
{
    res.status( data.statusCode ).json( {
        message: data.message,
        statusCode: data.statusCode,
        meta: data.meta,
        data: data.data
    } );
};

export const setCookie = async (
    res: Response,
    cookieName: string,
    cookieData: string | object | Record<string, unknown>,
    maxAge: number
): Promise<void> =>
{
    res.cookie( cookieName, cookieData, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge
    } );
};