import httpStatus from 'http-status-codes';
import type { StringValue } from "ms";
import { envStrings } from "../../config/env.config";
import { AppError } from "../../config/errors/App.error";
import { UserRole } from "../modules/user/user.interface";
import { generateToken } from "./middleware.util";

export type UserLike =
    | { id?: string; _id?: any; email: string; role: UserRole; name: string; username?: string }
    | { user: { id?: string; _id?: any; email: string; role: UserRole; name: string; username?: string } };

export const userTokens = async (user: UserLike) => {
    const userData = 'user' in user ? user.user : user;

    const userId = userData.id || userData._id?.toString();
    const email = userData.email;
    const role = userData.role;
    const name = userData.name;
    const username = userData.username || '';

    // console.log(userData);

    if (!userId || !email || !role || !name) {
        throw new AppError(httpStatus.BAD_REQUEST, "Missing required user info for token generation.");
    }

    const jwtPayload = {
        userId,
        username,
        email,
        role,
        name,
    };

    try {
        const accessToken = generateToken(
            jwtPayload,
            envStrings.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "3d"
            }
        );

        const refreshToken = generateToken(
            jwtPayload,
            envStrings.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "30d"
            }
        );

        return {
            accessToken,
            refreshToken,
        };
    } catch (error: unknown) {
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to generate tokens"
        );
    }
};