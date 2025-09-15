import { NextFunction, Request, Response } from "express";
import httpStatus from 'http-status-codes';
import { AppError } from "../../config/errors/App.error";
import { UserRole } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { isAllowedToUpdate } from "../utils/middleware.util";

export const checkUpdatePermission = async (
    req: Request,
    res: Response,
    next: NextFunction
) =>
{
    console.log(req.user)
    if (!req.user || !('userId' in req.user) || !('role' in req.user)) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");
    }

    const currentRole = req.user.role as UserRole; 
    const currentUserId = req.user.userId;
    const targetUserId = req.params.id;

    // Find target user
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found!");
    }

    const targetRole = targetUser.role;

    const allowed = isAllowedToUpdate(
        currentRole, 
        currentUserId.toString(), 
        targetRole, 
        targetUserId
    );

    if (!allowed) {
        throw new AppError(
            httpStatus.FORBIDDEN, 
            `You are not allowed to update this user!`
        );
    }

    console.log(allowed)

    // Attach target user
    req.targetUser = targetUser;

    next();
};