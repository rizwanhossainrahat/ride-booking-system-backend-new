import haversine from "haversine-distance";
import httpStatus from 'http-status-codes';
import mongoose from "mongoose";
import { AppError } from "../../../config/errors/App.error";
import { reverseGeocode } from "../../utils/helperr.util";
import { Driver } from "../driver/driver.model";
import { DriverStatus, VehicleInfo } from "../driver/river.interface";
import { ILocation, UserRole } from "../user/user.interface";
import { User } from "../user/user.model";
import { RideStatus } from "./ride.interface";
import { Ride } from "./ride.model";

interface ActiveDriverPayload extends Record<string, string | number | object | any> {
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


export const requestRideService = async (
    user: any,
    dropLat: number,
    dropLng: number,
    fare: number,
    pickUpLocation?: ILocation,
    distanceInKm?: Number
) => {
    if (!pickUpLocation || !dropLat || !dropLng) {
        throw new AppError(httpStatus.BAD_REQUEST, "Missing data: pickup or destination coordinates");
    }

    // Get all online drivers
    const driversRaw = await User.find({ isOnline: true, role: UserRole.DRIVER })
        .select("username email name location")
        .populate<{
            driver: {
                _id: mongoose.Types.ObjectId;
                driverStatus: DriverStatus;
                isApproved: boolean;
                vehicleInfo: VehicleInfo;
                rating?: { averageRating?: number };
            };
        }>("driver", "driverStatus isApproved vehicleInfo rating _id")
        .lean();

    // Filter available drivers
    const availableDrivers = driversRaw.filter(
        (u) => u.driver?.driverStatus === DriverStatus.AVAILABLE
    );

    const activeDrivers: ActiveDriverPayload[] = availableDrivers.map((u) => ({
        driverId: u.driver._id.toString(),
        userId: u._id.toString(),
        name: u.name,
        username: u.username,
        email: u.email,
        location: u.location as ILocation,
        isApproved: u.driver.isApproved,
        avgRating: u.driver.rating?.averageRating || 0,
        vehicleInfo: u.driver.vehicleInfo || ({} as VehicleInfo),
    }));

    // console.log(activeDrivers)

    if (activeDrivers.length === 0) {
        throw new AppError(httpStatus.EXPECTATION_FAILED, "No drivers are online!");
    }

    // Check if the user already has a pending ride
    const existingRide = await Ride.find({
        rider: user.userId,
        status: RideStatus.REQUESTED,
    });
    if (existingRide.length > 0) {
        throw new AppError(httpStatus.CONFLICT, "You have pending rides!");
    }

    // Get destination address
    const dropOffAddress = await reverseGeocode(dropLat, dropLng);
    const dropOffLocation: ILocation = {
        type: "Point",
        coordinates: [dropLat, dropLng],
        address: dropOffAddress?.displayName || "Default drop off address",
    };

    // Calculate distance from pickup to each driver
    const enrichedDrivers = activeDrivers.map((driver) => {
        // console.log(pickUpLocation, driver.location)
        const distanceInMeters = haversine(pickUpLocation.coordinates, driver.location.coordinates);

        const distanceInKm = Number((distanceInMeters / 1000).toFixed(2));

        console.log(distanceInKm, pickUpLocation.coordinates, driver.location.coordinates, "for distance calculation");
        return { ...driver, distanceInKm };
    });

    // Sort: highest rating first, then closest
    enrichedDrivers.sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return (a.distanceInKm || 0) - (b.distanceInKm || 0);
    });

    const matchedDriver = enrichedDrivers[0];
    if (!matchedDriver) throw new AppError(httpStatus.NOT_FOUND, "No available driver found");

    // // Estimate fare: 50 BDT base + 25/km
    // const estimatedFare = 50 + 25 * ( matchedDriver.distanceInKm || 0 );

    // Create ride
    const newRide = await Ride.create({
        rider: user.userId,
        driver: matchedDriver.driverId,
        pickUpLocation,
        dropOffLocation,
        driverLocation: matchedDriver.location,
        distanceInKm,
        fare,
        status: RideStatus.REQUESTED,
        requestedAt: new Date(),
        riderUserName: user.username,
        driverUserName: matchedDriver.username,
    });

    const ride = await Ride.findById(newRide._id)
        .populate("rider", "name email username")
        .populate("driver", "vehicleInfo rating driverStatus username");

    return { ride, totalAvailable: enrichedDrivers?.length };
};

export const ratingRideService = async (
    user: any,
    rideId: string,
    body: { rating: number }
) => {
    const { rating } = body;

    if (!rating || rating < 1 || rating > 5) {
        throw new AppError(httpStatus.BAD_REQUEST, "Rating must be between 1 and 5.");
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
        throw new AppError(httpStatus.NOT_FOUND, "Ride not found.");
    }

    // console.log(ride, user)

    if (!ride.rider || !user.userId || ride.rider.toString() !== user.userId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to rate this ride.");
    }


    if (ride.status !== RideStatus.COMPLETED) {
        throw new AppError(httpStatus.BAD_REQUEST, "You can only rate a completed ride.");
    }

    if (ride.rating && ride.rating.rating) {
        throw new AppError(httpStatus.BAD_REQUEST, "This ride has already been rated.");
    }

    //  Save rating to ride
    ride.rating = {
        riderId: new mongoose.Types.ObjectId(user.userId),
        rating,
        rideId: ride._id,
    };
    await ride.save();

    let updatedDriver = null;

    if (ride.driver) {
        const driver = await Driver.findById(ride.driver);
        if (driver) {
            const oldTotal = driver.rating?.totalRatings || 0;
            const oldAverage = driver.rating?.averageRating || 0;
            const newTotal = oldTotal + 1;
            const newAverage = (oldAverage * oldTotal + rating) / newTotal;

            updatedDriver = await Driver.findByIdAndUpdate(
                driver._id,
                {
                    $set: {
                        "rating.averageRating": newAverage,
                        "rating.totalRatings": newTotal,
                    },
                    $push: {
                        "rating.ratings": {
                            riderId: new mongoose.Types.ObjectId(user.userId),
                            rating,
                            rideId: ride._id,
                        },
                    },
                },
                { new: true }
            );
        }
    }

    return {
        rideRating: ride.rating,
        driverRating: updatedDriver?.rating ?? null,
    };
};