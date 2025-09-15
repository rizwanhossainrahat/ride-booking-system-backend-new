import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { DriverStatus, VehicleInfo } from "../modules/driver/river.interface";
import { Ride } from "../modules/ride/ride.model";
import { ILocation, UserRole } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { asyncHandler } from "../utils/controller.util";

export interface ActiveDriverPayload extends Record<string, string | number | object | any> {
  driverId: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  location: ILocation;
  isApproved: boolean;
  avgRating: number;
  vehicleInfo: VehicleInfo;
}

export const updateUserLocationIntoDb = asyncHandler( async (
    req: Request,
    res: Response,
    next: NextFunction
) =>
{
    const userLocation = req.userLocation;
    const user = req.user;

    if ( !user || !userLocation )
    {
        return next();
    }

    // Type guard to ensure user has required properties
    if ( !( 'username' in user ) )
    {
        throw new Error( "User object is missing required properties" );
    }

    const activeDrivers = await User.find(
        { isOnline: true, role: UserRole.DRIVER },
        { location: 1, username: 1, _id: 1, name: 1, email: 1 }
    )
        .select( "-password" )
        .populate<{
            driver: {
                _id: mongoose.Types.ObjectId;
                driverStatus: DriverStatus;
                isApproved: boolean;
                vehicleInfo: VehicleInfo;
                rating?: { averageRating?: number };
            }
        }>( "driver", "driverStatus isApproved vehicleInfo rating _id" )
        .lean();

    // Filter for AVAILABLE drivers only
    const availableDrivers = activeDrivers.filter(
        ( user ) => user.driver?.driverStatus === DriverStatus.AVAILABLE
    );

    // Create final payload with proper typing
    const activeDriverPayload: ActiveDriverPayload[] = availableDrivers.map( ( user ) => ( {
        driverId: user.driver._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        username: user.username,
        location: user.location as ILocation,
        isApproved: user.driver.isApproved,
        avgRating: user.driver.rating?.averageRating || 0,
        vehicleInfo: user.driver.vehicleInfo || {} as VehicleInfo,
    } ) );

    req.activeDriverPayload = activeDriverPayload;

    await User.findOneAndUpdate(
        { username: user.username },
        { $set: { location: userLocation } },
        { new: true }
    );

    console.log(user)
    if ( !( 'userId' in user ) || !( 'username' in user ) || !( 'role' in user ) )
    {
        throw new Error( "User object is missing required properties" );
    };

    if ( user.role === UserRole.DRIVER )
    {
        await Ride.findOneAndUpdate(
            { driver: new mongoose.Types.ObjectId( user?.userId as string ) },
            { $set: { driverLocation: userLocation } },
            { new: true }
        );
    }

    return next();
} );