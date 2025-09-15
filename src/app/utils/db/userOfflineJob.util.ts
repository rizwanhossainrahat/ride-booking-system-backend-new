import cron from "node-cron";
import { Driver } from "../../modules/driver/driver.model";
import { DriverStatus } from "../../modules/driver/river.interface";
import { UserRole } from "../../modules/user/user.interface";
import { User } from "../../modules/user/user.model";

export const scheduleUserOfflineJob = () =>
{
    cron.schedule( "0 * * * *", async () =>
    {
        const cutoff = new Date( Date.now() - 4 * 60 * 60 * 1000 ); 

        // Find users who are online but inactive
        const inactiveUsers = await User.find( {
            isOnline: true,
            lastOnlineAt: { $lt: cutoff },
        } );

        for ( const user of inactiveUsers )
        {
            user.isOnline = false;
            await user.save();

            // If driver
            if ( user.role === UserRole.DRIVER && user.driver )
            {
                await Driver.findByIdAndUpdate( user.driver, {
                    driverStatus: DriverStatus.UNAVAILABLE,
                } );
            }
        }

        console.log( `[CRON] User offline sync complete. Total: ${ inactiveUsers.length }` );
    } );
};