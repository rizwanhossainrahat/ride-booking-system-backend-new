import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validateRequest = (zodSchema: ZodType) => async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        // console.log(req.body);
        req.body = await zodSchema.parseAsync(req.body);
        next();
    } catch (error: unknown) {
        next(error);
    }
};