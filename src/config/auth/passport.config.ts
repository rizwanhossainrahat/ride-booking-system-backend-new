/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Driver } from "../../app/modules/driver/driver.model";
import { DriverStatus } from '../../app/modules/driver/river.interface';
import { UserRole } from "../../app/modules/user/user.interface";
import { User } from "../../app/modules/user/user.model";

passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password",
            passReqToCallback: true,
        },
        async ( req, email, password, done ) =>
        {
            try
            {

                const userLocation = req.userLocation;
                const user = await User.findOne( { email } ).populate<{
                    driver: {
                        _id: mongoose.Types.ObjectId;
                        driverStatus: DriverStatus;
                        isApproved: boolean;
                    } | null;
                }>( "driver" );
                
                let response

                if ( !user )
                {
                    return done( null, false, { message: "Invalid email or password" } );
                }

                if ( user.isBlocked )
                {
                    return done( null, false, { message: "Your account is blocked", flag: "BLOCKED", userId: user._id } as any );
                }

                if ( user?.driver?.driverStatus === DriverStatus.SUSPENDED )
                {
                    return done(
                        null,
                        false,
                        { message: "Your driver account is SUSPENDED", flag: "SUSPENDED", userId: user._id } as any
                    );
                }


                const isMatch = await bcrypt.compare( password, user.password );

                if ( !isMatch )
                {
                    return done( null, false, { message: "Invalid email or password" } );
                }

                response = await User.findOneAndUpdate(
                    { _id: user._id },
                    {
                        $set: {
                            isOnline: true,
                            location: userLocation,
                            lastOnlineAt: new Date(),
                        },
                    },
                    { new: true }
                )
                    .populate( "driver" )
                    .select( "-password" );

                if ( response?.role === UserRole.DRIVER )
                {

                    response = await Driver.findOneAndUpdate(
                        { user: user._id },
                        { $set: { driverStatus: DriverStatus.AVAILABLE } },
                        { new: true },
                    ).populate( "user", "email name role location lastOnlineAt username" );

                }

                if ( !response )
                {
                    return done( null, false, { message: "User not found" } );
                }

                // console.log("User logged in:", response, req.userLocation);
                return done( null, response );
            }
            catch ( error: unknown )
            {
                return done( error )
            }
        }
    )
);


passport.serializeUser( ( user: any, done: ( error: any, id?: any ) => void ) =>
{
    console.log("serializing the user", user)
    done( null, user._id );
} );

passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) =>
{
    try
    {
        console.log( id );
        const user = await User.findById( id )
        
        done( null, user || false );
        
    } catch ( error )
    {
        console.log(error)
        done(error)
    }
} );