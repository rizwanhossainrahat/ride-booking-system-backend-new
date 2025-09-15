import httpStatus from 'http-status-codes';
import mongoose from 'mongoose';
import { AppError } from "../../../config/errors/App.error";
import { QueryBuilder } from "../../utils/db/queybuilder.util";
import { Driver } from '../driver/driver.model';
import { DriverStatus, IDriver } from '../driver/river.interface';
import { RideStatus } from '../ride/ride.interface';
import { Ride } from '../ride/ride.model';
import { IUser, UserRole } from '../user/user.interface';
import { User } from "../user/user.model";
import { driverSearchableFields, excludeField, searchableFields } from "./admin.constrain";
import { approvalParam, blockParam, suspendParam } from './admin.type';


export const getAllUsersService = async ( query?: Record<string, string> ) =>
{
    const modelQuery = new QueryBuilder( User.find().populate("driver").select("-password"), query );

    const users = modelQuery.searchableField( searchableFields ).filter( excludeField ).sort().fields().pagination();

    const [data, meta] = await Promise.all( [
        users.modelQuery.exec(),
        modelQuery.getMeta()
    ] );

    console.log( query)

    return {
        data,
        meta,
    };
};

export const getUserByIdService = async ( userId: string ) =>
{
    const user = await User.findById( userId )
        .populate( [
            { path: "driver", populate: { path: "rides", select: "fare createdAt status" } },
            { path: "rideDetails", select: "fare status createdAt" },
            { path: "driverDetails", select: "name email" },
        ] )
        .select( "-password" )
        .lean<IUser & { driver?: IDriver }>();

    if ( !user ) throw new AppError( httpStatus.NOT_FOUND, "User not found" );

    let stats: any = {};

    if ( user.role === "DRIVER" && user.driver && typeof user.driver !== "string" )
    {
        const driverData = user.driver as IDriver;

        stats = {
            totalRides: driverData.totalRides,
            totalEarnings: driverData.totalEarnings,
            averageRating: driverData.rating?.averageRating || 0,
            ratingsCount: driverData.rating?.totalRatings || 0,
            earningsChart: driverData.rides?.map( ( ride ) => ( {
                date: ride.createdAt,
                fare: ride.fare,
            } ) ) as any,
        };
    } else
    {
        stats = {
            totalTrips: Array.isArray( user.ridings ) ? user.ridings.length : 0,
            totalSpent: user.rideDetails?.reduce( ( acc, r ) => acc + ( r.fare || 0 ), 0 ) || 0,
            tripHistoryChart: user.rideDetails?.map( ( r ) => ( {
                date: r.createdAt,
                fare: r.fare,
            } ) ),
        };
    }

    return { user, stats };
};

export const getAllDriversServices = async ( query?: Record<string, string> ) =>
{
    const modelQuery = new QueryBuilder( Driver.find().populate("user"), query );

    const users = modelQuery.searchableField( driverSearchableFields ).filter( excludeField ).sort().fields().pagination();

    const [ data, meta ] = await Promise.all( [
        users.modelQuery.exec(),
        modelQuery.getMeta()
    ] );

    console.log(data)

    return {
        data,
        meta,
    };
};


export const getDriverByIdService = async ( userId: string ) =>
{
    // console.log( userId );
    const user = await Driver.findOne({user: new mongoose.Types.ObjectId(userId)}  ).populate( "user" );

    if ( !user )
    {
        throw new AppError( httpStatus.NOT_FOUND, "driver not found" );
    }

    return user;
};

export const allRideService = async ( query?: Record<string, string> ) =>
{
    // console.log(query)
    const modelQuery = new QueryBuilder( Ride.find().populate( "driver" ).populate( "rider" ).select( "-password" ), query );

    const rides = modelQuery.searchableField( [ "riderUserName", "driverUserName", "status" ] ).filter( excludeField ).sort().fields().pagination();

    const [data, meta] = await Promise.all( [
        rides.modelQuery.exec(),
        modelQuery.getMeta()
    ] );

    // console.log(users)

    return {
        data,
        meta,
    };
};

export const getRideByIdService = async ( rideId: string ) =>
{
    const ride = await Ride.findById( rideId ).populate( "rider" ).populate( "driver" ).select( "-password" );
    console.log( rideId, ride );

    if ( !ride )
    {
        throw new AppError( httpStatus.NOT_FOUND, "ride not found" );
    }

    console.log(ride)
    return ride;
};

export const    suspendDriverIdService = async ( userId: string, param: suspendParam ) =>
{
    // console.log( userId , param !== 'suspend', param, param !== 'rollback');
    const user = await Driver.findOne( { user: new mongoose.Types.ObjectId( userId ) } );

    if (!param || (param !== 'suspend' && param !== 'rollback')) {
        throw new AppError(httpStatus.EXPECTATION_FAILED, `invalid suspendParam: ${param}`);
    }


    if ( !user )
    {
        throw new AppError( httpStatus.NOT_FOUND, "driver not found" );
    }

    if ( param === "suspend" && user.driverStatus === DriverStatus.SUSPENDED )
    {
        throw new AppError( httpStatus.CONFLICT, " driver already suspended!!" );
    }

    if ( param === "rollback" && user.driverStatus === DriverStatus.AVAILABLE )
    {
        throw new AppError( httpStatus.CONFLICT, " driver already available!!" );
    }

    if ( param === "suspend" && user.driverStatus === DriverStatus.RIDING )
    {
        throw new AppError( httpStatus.CONFLICT, " driver already working!! wait to be available first!!" );
    }

    console.log(user, param, user.driverStatus !== DriverStatus.AVAILABLE)
    let updateDriver;

    if ( param === "rollback" && user.driverStatus !== DriverStatus.AVAILABLE )
    {
        updateDriver = await Driver
            .findOneAndUpdate( { user: new mongoose.Types.ObjectId( userId ) },
                { $set: { driverStatus: DriverStatus.AVAILABLE } },
                { new: true } ).populate( "user" );
        
        console.log(updateDriver,"dfasfsdf")
        if ( updateDriver )
        {
            const updatedTheUser = await User.findByIdAndUpdate( new mongoose.Types.ObjectId( userId ), {
                $set: { isBlocked: false }
            }, { new: true } ).populate( "driver" );

            return updatedTheUser
        }
        else
        {
            throw new AppError( httpStatus.BAD_REQUEST, "Failed to update  the driver" )
        }
    }

    if ( param === "suspend" && user.driverStatus !== DriverStatus.SUSPENDED )
    {
        updateDriver = await Driver
            .findOneAndUpdate( { user: new mongoose.Types.ObjectId( userId ) },
                { $set: { driverStatus: DriverStatus.SUSPENDED } },
                { new: true } ).populate( "user" );
        
        if ( updateDriver )
        {
            const updatedTheUser = await User.findByIdAndUpdate( new mongoose.Types.ObjectId( userId ), {
                $set: { isBlocked: true }
            }, { new: true } ).populate( "driver" );

            console.log(updateDriver, updatedTheUser)
            return updatedTheUser
        }
        else
        {
            throw new AppError( httpStatus.BAD_REQUEST, "Failed to update  the driver" )
        }
    }   
};

export const blockUserByIdService = async ( userId: string, param: blockParam ) =>
{
    // console.log( param, !param || param !== 'block' || param !== 'rollback' );
    const user = await User.findById( new mongoose.Types.ObjectId( userId ) );

    if (!param || (param !== 'block' && param !== 'rollback')) {
        throw new AppError(httpStatus.EXPECTATION_FAILED, `invalid blockParam: ${param}`);
    }

    if ( !user )
    {
        throw new AppError( httpStatus.NOT_FOUND, " user not found" );
    }

    if ( param === "block" && user.isBlocked )
    {
        throw new AppError( httpStatus.CONFLICT, " user already blocked!!" );
    }

    if ( param === "rollback" && !user.isBlocked )
    {
        throw new AppError( httpStatus.CONFLICT, " user already unblocked!!" );
    }

    let updatedTheUser;
    if ( param === "rollback" && user.isBlocked )
    {
        updatedTheUser = await User.findByIdAndUpdate( new mongoose.Types.ObjectId( userId ), {
            $set: { isBlocked: false }
        }, { new: true } ).populate( "driver" );
    }

    if ( param === "block" && !user.isBlocked )
    {
        updatedTheUser = await User.findByIdAndUpdate( new mongoose.Types.ObjectId( userId ), {
            $set: { isBlocked: true }
        }, { new: true } ).populate( "driver" );
    }
    
    if ( updatedTheUser?.role === UserRole.DRIVER )
    {
        updatedTheUser = await Driver.findOneAndUpdate( { user: new mongoose.Types.ObjectId( userId ) }, {
            $set: { driverStatus: DriverStatus.SUSPENDED }
        }, { new: true } ).populate( "user" );

        return updatedTheUser
    }
};

export const deleteBlockedUserService = async ( userId: string ) =>
{
    const findUser = await User.findById( userId );
    
    if ( !findUser )
    {
        throw new AppError( httpStatus.NOT_FOUND, "user not found" )
    }

    if ( findUser?.isBlocked )
    {
        await User.findOneAndDelete( { _id: userId } );
        
        return findUser;
    }
    else
    {
        throw new AppError( httpStatus.UNPROCESSABLE_ENTITY, "User is not blocked!! to delete a user please block the user!" )
    }
    
};

export const deleteRideService = async ( rideId: string ) =>
{
    const findRide = await Ride.findOne( { _id: rideId } );
    
    if ( !findRide )
    {
        throw new AppError( httpStatus.NOT_FOUND, "ride not found" )
    }

    if ( findRide.status !== RideStatus.COMPLETED )
    {
        throw new AppError(
            httpStatus.FORBIDDEN,
            `Cannot delete ride with status: ${ findRide.status }. Only COMPLETED rides can be deleted.`
        );
    }

    if ( findRide )
    {
        await Ride.deleteOne( { _id: rideId } );
        
        return findRide;
    }
    else
    {
        throw new AppError( httpStatus.UNPROCESSABLE_ENTITY, "can not delete the ride" )
    }
    
};

export const approveDriverService = async ( driverId: string, param: approvalParam ) =>
{
    // console.log( userId );
    const driver = await Driver.findOne( { user: new mongoose.Types.ObjectId( driverId ) } );

    
    if (!param || (param !== 'approved' && param !== 'notApproved')) {
        throw new AppError(httpStatus.EXPECTATION_FAILED, `invalid approvalParam: ${param}`);
    }

    if ( !driver )
    {
        throw new AppError( httpStatus.NOT_FOUND, " driver not found" );
    }

    if ( param === "notApproved" && !driver.isApproved )
    {
        throw new AppError( httpStatus.CONFLICT, " driver already notApproved!!" );
    }

    if ( param === "approved" && driver.isApproved )
    {
        throw new AppError( httpStatus.CONFLICT, " driver already approved!!" );
    }

    let updatedTheDriver;
    if ( param === "notApproved" && driver.isApproved )
    {
        updatedTheDriver = await Driver.findOneAndUpdate( { user: new mongoose.Types.ObjectId( driverId ) }, {
            $set: { isApproved: false, driverStatus: DriverStatus.NOTAPPROVED }
        }, { new: true } );
    }

    if ( param === "approved" && !driver.isApproved )
    {
        updatedTheDriver = await Driver.findOneAndUpdate( { user: new mongoose.Types.ObjectId( driverId ) }, {
            $set: { isApproved: true, driverStatus: DriverStatus.APPROVED }
        }, { new: true } );
    }

    // console.log( driver, updatedTheDriver, driver.isApproved, param === "approved", param )
    return updatedTheDriver;
};