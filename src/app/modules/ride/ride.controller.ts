import { Request, Response } from "express";
import httpStatus from 'http-status-codes';
import { AppError } from "../../../config/errors/App.error";
import { asyncHandler, responseFunction } from "../../utils/controller.util";
import { QueryBuilder } from "../../utils/db/queybuilder.util";
import { reverseGeocode } from "../../utils/helperr.util";
import { excludeField } from "../admin/admin.constrain";
import { Driver } from "../driver/driver.model";
import { ILocation, UserRole } from "../user/user.interface";
import { User } from "../user/user.model";
import { Ride } from "./ride.model";
import { ratingRideService, requestRideService } from "./ride.service";


export const requestRide = asyncHandler( async ( req: Request, res: Response ) =>
{
    let location : ILocation = req.userLocation;
    
    if ( req.body.picLat && req.body.picLng )
    {
        const pickUpAddress = await reverseGeocode( req.body.picLat, req.body.picLng );

        location = {
            coordinates: [ req.body.picLat, req.body.picLng ],
            type: 'Point',
            address: pickUpAddress?.displayName || "Default pick up address!"
        }
    }

    // console.log( location, req.body )

    const user = req.user as any;
    const activeDriver = req.activeDriverPayload;
    const { lat, lng, fare, distanceInKm } = req.body;
    
    
    if ( !lat || !lng) {
        throw new AppError(httpStatus.BAD_REQUEST, "DropOff location or destination missing");
    };

    const response = await requestRideService( user, lat, lng, fare, location, distanceInKm );

    if ( !response && !user && !location )
    {
        responseFunction( res, {
        message: `something wrong while requesting a ride!!`,
        statusCode: httpStatus.OK,
        data: null
    } );
    }

    responseFunction( res, {
        message: `successfully requested the ride now you have confirm the ride with the fare`,
        statusCode: httpStatus.OK,
        data: response,

    } );
} );

export const ratingOwnRide = asyncHandler( async ( req: Request, res: Response ) =>
{
    const user = req.user;
    const rideId = req.params?.id;
    const body = req.body;

    if ( !user || !rideId || !body )
    {
        throw new AppError(httpStatus.EXPECTATION_FAILED, "Required user, body, rideId!!")
    }

    const ratings = await ratingRideService( user, rideId, body );

    responseFunction( res, {
        message: "Ratings oka!!",
        statusCode: httpStatus.ACCEPTED,
        data: ratings
    })

} );

export const getActiveDrivers = asyncHandler( async ( req: Request, res: Response ) =>
{
    const user = req.user;

    if ( !user )
    {
        throw new AppError( httpStatus.EXPECTATION_FAILED, "Required user" );
    }

    // Find all online drivers and populate driver info
    const activeDrivers = await User.find(
        { isOnline: true, isBlocked: false, role: UserRole.DRIVER },
        { location: 1, username: 1, _id: 1, name: 1, email: 1, isOnline: 1 }
    ).populate( {
        path: "driver",
        select: "driverStatus isApproved vehicleInfo rating _id driver",
    } ).lean();

    // console.log(activeDrivers)

    responseFunction( res, {
        message: "Active drivers retrieved successfully",
        statusCode: httpStatus.OK,
        data: activeDrivers,
    } );
} );

export const getUserRides = asyncHandler( async ( req: Request, res: Response ) =>
{
    const role = req.user?.role;
    const userId = req.user?.userId;
    const query = req.query as Record<string, string>;

    let filter: Record<string, unknown> = {};

    if ( role === UserRole.DRIVER )
    {
        const driver = await Driver.findOne( { user: userId } );
        if ( !driver )
        {
            throw new AppError( httpStatus.NOT_FOUND, "He is not a driver!" );
        }
        filter = { driver: driver._id };
    } else
    {
        filter = { rider: userId };
    }

    const ridesQuery = new QueryBuilder(
        Ride.find( filter ).populate( "driver" ).populate( "rider" ),
        query
    )
        .searchableField( [ "riderUserName", "driverUserName", "status" ] )
        .filter( excludeField )
        .sort()
        .fields()
        .pagination();
    
    const [ data, meta ] = await Promise.all( [
        ridesQuery.modelQuery.exec(),
        ridesQuery.getMeta() 
    ] );

    console.log(meta)
    responseFunction( res, {
        message: "Your rides",
        statusCode: httpStatus.OK,
        data: { data, meta },
    } );
} );