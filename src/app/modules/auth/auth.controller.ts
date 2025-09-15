import { NextFunction, Request, Response } from "express";
import httpStatus from 'http-status-codes';
import passport from "passport";
import { AppError } from "../../../config/errors/App.error";
import { asyncHandler, responseFunction, setCookie } from "../../utils/controller.util";
import { userTokens } from "../../utils/service.util";
import { getNewAccessTokenService, userLogoutService } from "./auth.service";

export const userLogin = asyncHandler( async ( req: Request, res: Response, next: NextFunction ) =>
{
  passport.authenticate( "local", { session: false }, async ( error, user: any, info: { message?: string, flag?: string, userId?: string } ) =>
  {
    if ( error )
    {
      console.error( "Authentication error:", error );
      return next( new AppError( httpStatus.INTERNAL_SERVER_ERROR, typeof error === 'string' ? error : 'Authentication failed', ) );
    }

    if (info?.flag === 'BLOCKED') {
      return res.status(403).json({ message: info.message, flag: 'BLOCKED', userId: info.userId });
    }

    if (info?.flag === 'SUSPENDED') {
      return res.status( 403 ).json( { message: info.message, flag: 'SUSPENDED', userId: info.userId } );
      
    }

    if ( !user )
    {
      return next( new AppError( httpStatus.UNAUTHORIZED, info?.message || "Unauthorized" ) );
    }

    const loginData = await userTokens( user );

    await setCookie( res, "refreshToken", loginData.refreshToken, 30 * 60 * 60  * 1000 );
    await setCookie( res, "accessToken", loginData.accessToken, 3 * 60  * 1000 );

    const responseData = user?.toObject();
    delete responseData.password;

    responseFunction( res, {
      message: "User logged in successfully",
      statusCode: httpStatus.ACCEPTED,
      data: {
        email: user?.email,
        userId: user?._id,
        user: responseData,
      },
    } );
  } )( req, res, next );
} );

export const userLogout = asyncHandler( async ( req: Request, res: Response ) =>
{
  await setCookie( res, "refreshToken", "", 0 );
  await setCookie( res, "accessToken", "", 0 );
  console.log( req.user );
  
  if ( !req.user?.userId )
  {
    throw new AppError( httpStatus.BAD_REQUEST, "User ID not found in request" );
  }

  
  await userLogoutService( req.user.userId );

  responseFunction( res, {
    message: "User logged out successfully",
    statusCode: httpStatus.OK,
    data: null,
    
  } );
} );

export const getNewAccessToken = asyncHandler( async ( req: Request, res: Response ) =>
{
    const refreshToken = req.cookies.refreshToken;

    if ( !refreshToken )
    {
        throw new AppError( httpStatus.BAD_REQUEST, "Cookies or user not found!!" );
    }

    const tokenInfo = await getNewAccessTokenService( refreshToken );
    if ( !tokenInfo )
    {
        throw new AppError( httpStatus.UNAUTHORIZED, "Invalid refresh token or user not found!!" );
    }

    if ( tokenInfo.refreshToken && tokenInfo.accessToken )
    {
        await setCookie( res, "refreshToken", tokenInfo.refreshToken, 3 * 60 * 60 * 1000 );
        await setCookie( res, "accessToken", tokenInfo.accessToken,  30 * 60 * 1000 );

        responseFunction( res, {
            message: `New tokens created!!`,
            statusCode: httpStatus.CREATED,
            data: tokenInfo,
        } );
    } else
    {
        throw new AppError( httpStatus.UNAUTHORIZED, "Error in creating new tokens!!" );
    }
} );