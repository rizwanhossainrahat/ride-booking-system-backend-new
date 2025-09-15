import { model, Schema } from "mongoose";
import { ratingSchema } from "../driver/driver.model";
import { locationSchema } from "../user/user.model";
import { CancelledBy, IRide, RideStatus } from "./ride.interface";

export const rideSchema = new Schema<IRide>( {
    rider: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    riderUserName: {
        type: String,
        require: true,
        ref: "User"
    },
    driverUserName: {
        type: String,
        require: true,
        ref: "Driver"
    },
    pickUpLocation: locationSchema,
    dropOffLocation: locationSchema,
    driverLocation:locationSchema,
    fare: { type: Number, required: true },
    status: {
        type: String,
        enum: RideStatus,
        default: RideStatus.REQUESTED,
    },
    requestedAt: { type: Date, default: Date.now },
    expiresAt: {
        type: Date, default: () => new Date( Date.now() + 5 * 60 * 60 * 1000 ),
        index: { expireAfterSeconds: 0 },
    },
    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: {
        type: String,
        enum: CancelledBy,
    },
    distanceInKm: { type: Number },
    durationInMin: { type: Number },
    rating: ratingSchema,
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
} );


export const Ride = model<IRide>( "Ride", rideSchema );