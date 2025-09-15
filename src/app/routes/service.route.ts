import { Router } from "express";
import { driverRoutes } from "../modules/driver/driver.route";
import { locationRouter } from "../modules/location/location.route";
import { rideRoutes } from "../modules/ride/ride.route";

export const riderRouter = Router();

const riderRoute = [
    {
        path: "/ride",
        route: rideRoutes
    },
    {
        path: "/driver",
        route: driverRoutes
    },
    {
        path: "/location",
        route: locationRouter
    }
];

riderRoute.forEach(router => {
    riderRouter.use(router.path, router.route);
});