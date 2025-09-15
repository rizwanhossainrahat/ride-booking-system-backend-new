import { Router } from "express";
import { authRoute } from "../modules/auth/auth.route";
import { userRoute } from "../modules/user/user.route";

export const firstVersionRouter = Router();

const moduleRouter = [
    {
        path: "/user",
        route: userRoute
    },
    {
        path: "/auth",
        route: authRoute
    }
];

moduleRouter.forEach( router =>
{
    firstVersionRouter.use( router.path, router.route )
} );