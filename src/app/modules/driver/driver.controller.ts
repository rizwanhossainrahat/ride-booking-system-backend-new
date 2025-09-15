import { Request, Response } from "express";
import httpStatus from 'http-status-codes';
import { AppError } from "../../../config/errors/App.error";
import { asyncHandler, responseFunction } from "../../utils/controller.util";
import { Driver } from "./driver.model";
import { acceptRideRequestService, cancelRideRequestService, checkRideRequestService, completeRideService, driverStateService, inTransitRideService, pickUpService, updateVehicleService } from "./driver.service";
import { DriverStatus } from "./river.interface";


export const changeDrivingStatus = asyncHandler( async ( req: Request, res: Response ) =>
{
    const user = req.user;

    
    if ( user?.role !== "DRIVER" )
    {
        res.status( httpStatus.BAD_REQUEST ).json( {
            message: "Driver not found",
            statusCode: httpStatus.BAD_REQUEST,
        } );

        return;
    }

    // Find driver
    const findDriver = await Driver.findOne( { username: user.username } );
    if ( !findDriver )
    {
        res.status( httpStatus.NOT_FOUND ).json( {
            message: "Driver not found in database",
            statusCode: httpStatus.NOT_FOUND,
        } );

        return
    }

    // Toggle status
    const newStatus =
        findDriver.driverStatus === DriverStatus.AVAILABLE
            ? DriverStatus.UNAVAILABLE
            : DriverStatus.AVAILABLE;

    const updatedDriver = await Driver.findByIdAndUpdate(
        findDriver._id,
        { $set: { driverStatus: newStatus } },
        {upsert: true ,new: true }
    );

    responseFunction( res, {
        message: `Driver status updated to ${ newStatus }`,
        statusCode: httpStatus.OK,
        data: updatedDriver,
    } );
} );


export const checkRideRequest = asyncHandler( async ( req: Request, res: Response) =>
{
    console.log("check ride request hit!")
    // const body = req.body;
    const user = req.user;
    const username = user.username;
    // console.log( user )
    
    if ( !username )
    {
        throw new AppError(httpStatus.BAD_REQUEST, "username got empty!!")
    }
    const ride = await checkRideRequestService( username, res );

    responseFunction( res, {
        message: `Found some ride requests!!`,
        statusCode: httpStatus.OK,
        data:ride
    })
} );

export const acceptRideRequest = asyncHandler( async ( req: Request, res: Response ) =>
{
    const rideId = req.params.id;
    const user = req.user;

    console.log( "got it accept ride api" );

    const acceptedRide = await acceptRideRequestService( rideId, user );

    responseFunction( res, {
        message: `Ride accepted!!!`,
        statusCode: httpStatus.ACCEPTED,
        data: acceptedRide
    } )
} );

export const cancelRideRequest = asyncHandler( async ( req: Request, res: Response ) =>
{
    const rideId = req.params.id;
    const user = req.user;

    const cancelRide = await cancelRideRequestService( rideId, user );

    responseFunction( res, {
        message: `Ride cancelled!!!`,
        statusCode: httpStatus.OK,
        data: cancelRide
    } )
} );


export const pickUpRide = asyncHandler( async ( req: Request, res: Response ) =>
{
    const id = req.params.id;

    const pickUp = await pickUpService( id );

    responseFunction( res, {
        message: "Picked up the user!",
        statusCode: httpStatus.OK,
        data: pickUp
    })
} );

export const inTransitRide = asyncHandler( async ( req: Request, res: Response ) =>
{
    const id = req.params.id;

    const inTransit = await inTransitRideService( id );

    responseFunction( res, {
        message: "In transit the the user!",
        statusCode: httpStatus.OK,
        data: inTransit
    })
} );

export const completeRide = asyncHandler( async ( req: Request, res: Response ) =>
{
    const id = req.params.id;
    const user = req.user;

    const completedRide = await completeRideService( id, user );

    responseFunction( res, {
        message: "Completed the ride!!!",
        statusCode: httpStatus.OK,
        data: completedRide
    })
} );

// driver self
export const updateVehicleInfo = asyncHandler( async ( req: Request, res: Response ) =>
{
    const driverId = req.params.id;
    const body = req.body;

    const updatedVehicle = await updateVehicleService( driverId, body );

    if ( !updatedVehicle )
    {
        throw new AppError( httpStatus.EXPECTATION_FAILED, "failed to update the target vehicle!!" )
    }

    responseFunction( res, {
        message: "Vehicle updated!!",
        statusCode: httpStatus.ACCEPTED,
        data: updatedVehicle
    } )
} );

export const driverState = asyncHandler( async ( req: Request, res: Response ) =>
{
    const userId = req.user.userId;

    const states = await driverStateService( userId );

    if ( !states )
    {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Something happened when tried to fetch the driver state!!")
    }

    // console.log(states, "driver stats hits")

    responseFunction( res, {
        message: "Driver states fetched!!",
        statusCode: httpStatus.ACCEPTED,
        data: states
    } );
} );

