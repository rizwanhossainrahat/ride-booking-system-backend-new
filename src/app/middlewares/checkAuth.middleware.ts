import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status-codes';
import { JwtPayload } from "jsonwebtoken";
import { envStrings } from "../../config/env.config";
import { AppError } from '../../config/errors/App.error';
import { UserRole } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';
import { verifyToken } from "../utils/middleware.util";

// Extend the JwtPayload interface to include your custom token fields
interface CustomJwtPayload extends JwtPayload {
    username: string;
    role: UserRole;
    userId: string;
    name: string;
};

export const checkAuth = (...authRoles: UserRole[]) => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => { 
      try
      {
        // console.log(req.cookies)
        const accessToken = req.cookies?.accessToken;

        if (!accessToken) {
            throw new AppError(httpStatus.FORBIDDEN, "No Token Received!");
        }

        const verifiedToken = verifyToken( accessToken, envStrings.ACCESS_TOKEN_SECRET ) as CustomJwtPayload;
        
        // console.log(verifiedToken, accessToken)

        if (!verifiedToken.username) {
            throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token payload");
        }

        const user = await User.findOne({ username: verifiedToken.username }).select('+isBlocked');

        if (!user) {
            throw new AppError(httpStatus.NOT_FOUND, `User not found`);
        }

        if (user.isBlocked) {
            throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
        }

        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError(
                httpStatus.FORBIDDEN, 
                `You are not permitted to view this route! Your role: ${verifiedToken.role}`
            );
        }

        req.user = verifiedToken;
        req.userLocation = user.location;

        next();
    }
    catch ( error: unknown )
    {
        if (error instanceof AppError) {
            next(error);
        } else if (error instanceof Error) {
            next(new AppError(httpStatus.UNAUTHORIZED, error.message));
        } else {
            next(new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Unknown authentication error"));
        }
    }
};