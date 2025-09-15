import { Request, Response } from "express";
import httpStatus from 'http-status-codes';
import { AppError } from "../../../config/errors/App.error";
import { asyncHandler, responseFunction } from "../../utils/controller.util";
import { Ride } from "../ride/ride.model";
import { User } from "./user.model";
import { createUserService, getUserByIdService, updateUserService } from "./user.service";


export const createUser = asyncHandler( async ( req: Request, res: Response ): Promise<void> =>
{
    // console.log(req.body)
    const user = await createUserService( req.body );

    // console.log(user)

    if ( !user )
    {
        responseFunction( res, {
            message: `Something went wrong when creating the user`,
            statusCode: httpStatus.EXPECTATION_FAILED,
            data: null,
        } );

        return;
    }

    responseFunction( res, {
        message: `User created!!`,
        statusCode: httpStatus.CREATED,
        data: user,
    } );
} );

export const getMe = asyncHandler( async ( req: Request, res: Response ): Promise<void> =>
{
    // console.log("User me got a hit!")
    if ( !req.user || !( 'userId' in req.user ) )
    {
        throw new AppError( httpStatus.UNAUTHORIZED, "User not authenticated" );
    }
    const userId: any = req.user?.userId;
    const user = await getUserByIdService( userId );

    responseFunction( res, {
        message: "User retrieved successfully",
        statusCode: httpStatus.OK,
        data: user,
    } );
} );


export const updateUser = asyncHandler( async ( req: Request, res: Response ): Promise<void> =>
{
    console.log("update user hit")
    const userId = req.params?.id
    if ( !userId )
    {
        throw new AppError( httpStatus.BAD_REQUEST, "No userId detected!!" )
    }

    const user = await updateUserService( userId, req.body );

    if ( !user )
    {
        throw new AppError( httpStatus.EXPECTATION_FAILED, "Failed to update the user" )
    }

    responseFunction( res,
        {
            message: "User successfully updated!!",
            statusCode: httpStatus.OK,
            data: user,
        }
    )
} );


export const getUserStats = asyncHandler( async ( req: Request, res: Response ) =>
{
    const userId = req.user.userId; 

    const user = await User.findById( userId );

    if ( !user )
    {
        throw new AppError( httpStatus.NOT_FOUND, "User not found!!" );
    }

    const rides = await Ride.find( { rider: user._id } ).populate( "driver" );

    if ( !rides )
    {
        throw new AppError( httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch rides for user" );
    }

    const completedRides = rides.filter( ride => ride.status === "COMPLETED" );
    const totalSpent = completedRides.reduce( ( sum, ride ) => sum + ( ride.fare || 0 ), 0 );
    const totalRides = completedRides.length;
    const totalTravelledInKm = completedRides.reduce(
        ( sum, ride ) => sum + ( ride.distanceInKm || 0 ),
        0
    );
    const recentRides = rides
        .sort( ( a, b ) => b.requestedAt.getTime() - a.requestedAt.getTime() )
        .slice( 0, 3 );

    
    const stats = {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isOnline: user.isOnline,
        },
        rides: recentRides,
        totalSpent,
        totalRides,
        totalTravelledInKm,
    };

    responseFunction( res, {
        message: "User stats fetched successfully!",
        statusCode: httpStatus.OK,
        data: stats,
    } );
} );
