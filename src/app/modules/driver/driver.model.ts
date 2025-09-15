import { model, Schema } from "mongoose";
import { DriverStatus, IDriver } from "./river.interface";

export const vehicleInfoSchema = new Schema({
    license: { type: String, required: true },
    model: { type: String, required: true },
    plateNumber: { type: String, unique: true },
} );

export const ratingSchema = new Schema({
    riderId: { type: Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5 },
    rideId: { type: Schema.Types.ObjectId, ref: "Ride" }
});

export const driverSchema = new Schema<IDriver>( {
    isApproved: {
        type: Boolean,
        default: true,
    },
    vehicleInfo: vehicleInfoSchema,
    driverStatus: {
        type: String,
        enum: DriverStatus,
        default: DriverStatus.UNAVAILABLE,
    },
    rides: [
        {
            type: Schema.Types.ObjectId,
            ref: "Ride",
        },
    ],
    rating: {
        averageRating: { type: Number, default: 0 },
        totalRatings: { type: Number, default: 0 },
        ratings: [ ratingSchema ]
    },
    totalEarnings: { type: Number, default: 0 },
    totalRides: { type: Number, default: 0 },
    rider: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: {
        type: String,
        unique: true,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
} );

// userSchema.virtual( 'driverDetails', {
//     ref: 'Driver',
//     localField: 'ridings.driverId',
//     foreignField: '_id',
//     justOne: false
// } );

export const Driver = model<IDriver>( "Driver", driverSchema );
