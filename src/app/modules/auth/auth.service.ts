import httpStatus from 'http-status-codes';
import mongoose from 'mongoose';
import { envStrings } from '../../../config/env.config';
import { AppError } from '../../../config/errors/App.error';
import { verifyToken } from '../../utils/middleware.util';
import { userTokens } from '../../utils/service.util';
import { Driver } from '../driver/driver.model';
import { DriverStatus } from '../driver/river.interface';
import { UserRole } from '../user/user.interface';
import { User } from '../user/user.model';

export const userLogoutService = async ( userId: string ) => {
    // console.log("Logging out user with ID:", userId);
    
    const user = await User.findByIdAndUpdate(
        new mongoose.Types.ObjectId(userId),
        { isOnline: false },
        { new: true }
    );   

    if ( !user ) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if ( user.role === UserRole.DRIVER )
    {
        await Driver.findOneAndUpdate(
            { user: user._id },
            { $set: { driverStatus: DriverStatus.UNAVAILABLE } },
            { new: true }
        );
    }

    // console.log("User logged out successfully:", user);
    return user;
};

export const getNewAccessTokenService = async ( refreshToken: string ) =>
{
    
    const refreshTokenVerify : any = verifyToken( refreshToken, envStrings.REFRESH_TOKEN_SECRET as string );

    const user = await User.findOneAndUpdate(
        { email: refreshTokenVerify?.email },
        { $set: { lastOnlineAt: new Date() } },
        { new: true }
    );

    console.log(user, refreshTokenVerify)
    if ( !user )
    {
        throw new AppError( httpStatus.NOT_FOUND, "User not found!!" );
    }

    if ( user.isOnline && !user.isBlocked )
    {
        const { accessToken, refreshToken } = await userTokens( user );
        
        return { accessToken, refreshToken }
    }
    else
    {
        throw new AppError( httpStatus.CONFLICT, "Error in new token service!!" )
    }
};