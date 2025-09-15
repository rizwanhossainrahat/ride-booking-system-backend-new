import bcrypt from "bcryptjs";
import httpStatus from 'http-status-codes';
import mongoose from 'mongoose';
import { envStrings } from '../../../config/env.config';
import { AppError } from "../../../config/errors/App.error";
import { Driver } from '../driver/driver.model';
import { VehicleInfo } from "../driver/river.interface";
import { IUser, UserRole } from './user.interface';
import { User } from "./user.model";

export const createUserService = async (payload: IUser) => {
    const session = await mongoose.startSession();
    await session.startTransaction();

    const { email, ...rest } = payload;


    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
        throw new AppError(httpStatus.CONFLICT, "User already exists with this email");
    }

    console.log(payload, existingUser)
    const userDocs = await User.create([{ email, ...rest }], { session });
    console.log(userDocs)
    const createdUser = userDocs[0].toObject();
    delete createdUser.password;



    let createdDriver = null;

    if (createdUser.role === UserRole.DRIVER) {
        if (!payload.vehicleInfo) {
            throw new AppError(httpStatus.BAD_REQUEST, "Driver must provide vehicle info");
        }

        const driverDocs = await Driver.create([{
            user: createdUser._id,
            username: createdUser.username,
            vehicleInfo: payload.vehicleInfo as VehicleInfo,
        }], { session });

        if (!driverDocs?.length) {
            throw new AppError(httpStatus.EXPECTATION_FAILED, "Failed to create driver");
        }

        console.log(driverDocs[0]);
        // Link the driver to the user
        const updatedUser = await User.findByIdAndUpdate(
            createdUser._id,
            { driver: driverDocs[0]._id },
            { new: true, session }
        ).populate({ path: "driver", select: "-password" });

        createdDriver = updatedUser?.toObject();
        delete createdDriver.password;
    }

    await session.commitTransaction();
    session.endSession();

    return createdUser.role === UserRole.DRIVER
        ? createdDriver
        : createdUser;
};

export const getUserByIdService = async (userId: string): Promise<IUser | null> => {
    // console.log("Fetching user by ID:", userId);
    const user = await User.findById(userId).select("-password").populate("driver").populate('rideDetails')
        .populate('driverDetails').lean();

    if (!user) {
        // console.log("User not found with ID:", userId);
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
}

// export const updateUserService = async ( userId: string, payload: any ) =>
// {
//     const user = await User.findById( userId );
//     console.log( payload );

//     if ( payload.oldPassword )
//     {
//         const isMatch = await bcrypt.compare( payload.oldPassword, user.password );

//         if ( !isMatch )
//         {
//             throw new AppError(httpStatus.UNAUTHORIZED, "old password mismatched!")
//         }

//         payload.newPassword = await bcrypt.hash( payload.newPassword, Number(envStrings.BCRYPT_SALT) );
//     }

//     const newUpdatedUser = await User.findByIdAndUpdate( userId, {name: payload.name, password: payload.newPassword}, { new: true, runValidators: true } ).lean();

//     delete newUpdatedUser?.password;

//     return newUpdatedUser;
// }


// user data update


export const updateUserService = async (userId: string, payload: any) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found!");
    }

    // Password update logic
    if (payload.oldPassword) {
        const isMatch = await bcrypt.compare(payload.oldPassword, user.password);
        if (!isMatch) {
            throw new AppError(httpStatus.UNAUTHORIZED, "old password mismatched!");
        }
        payload.newPassword = await bcrypt.hash(
            payload.newPassword,
            Number(envStrings.BCRYPT_SALT)
        );
    }

    // Update fields object
    const updateFields: any = {};

    if (payload.name) updateFields.name = payload.name;
    if (payload.newPassword) updateFields.password = payload.newPassword;

    console.log("location payload",payload)
    // ✅ Location update/create
    if (payload.location) {
        updateFields.location = {
            type: "Point",
            coordinates: [
                payload.location.coordinates[0], // lng
                payload.location.coordinates[1], // lat
            ],
            address: payload.location.address,
        };
    }

    const newUpdatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).lean();

    delete newUpdatedUser?.password;

    return newUpdatedUser;
};
