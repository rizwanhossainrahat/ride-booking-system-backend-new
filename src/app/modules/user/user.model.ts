import bcrypt from 'bcryptjs';
import { model, Schema } from "mongoose";
import { envStrings } from "../../../config/env.config";
import { generateSlug } from '../../utils/helperr.util';
import { Driver } from '../driver/driver.model';
import { ILocation, IUser, UserRole } from "./user.interface";

export const locationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    default: [0, 0]
  },
  address: {
    type: String
  }
});

export const userSchema = new Schema<IUser>( {
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: [ 5, 'Password must be at least 5 characters long' ],
    },
    role: {
        type: String,
        required: true,
        enum: Object.values( UserRole ),
        default: UserRole.RIDER
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    driver: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        default: null,
    },
    ridings: [
        {
            rideId: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
            driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true }
        }
    ],
    lastOnlineAt: {
        type: Date,
        default: Date.now,
    },
    location: locationSchema,
    vehicleInfo: {
        type: Schema.Types.Mixed,
        default: null,
        required: function ( this: any )
        {
            return this.role === UserRole.DRIVER;
        },
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
} );

userSchema.virtual( 'rideDetails', {
    ref: 'Ride',
    localField: 'ridings.rideId',
    foreignField: '_id',
    justOne: false 
} );

userSchema.virtual( 'driverDetails', {
    ref: 'Driver',
    localField: 'ridings.driverId',
    foreignField: '_id',
    justOne: false
} );

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(
            this.password,
            Number(envStrings.BCRYPT_SALT)
        );
    }

    if (this.isModified("email") || this.isNew) {
        this.username = generateSlug(this.email, this.role);
    }

    next();
});

userSchema.pre("findOneAndDelete", async function (next) {
    const userId = this.getQuery()._id;

    if (userId) {
        await Driver.deleteMany({ user: userId });
    }

    next();
});

export const User = model<IUser>("User", userSchema);