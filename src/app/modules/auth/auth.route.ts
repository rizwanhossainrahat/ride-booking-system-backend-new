import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.middleware";
import { validateRequest } from "../../middlewares/validateReq.middleware";
import { UserRole } from "../user/user.interface";
import { getNewAccessToken, userLogin, userLogout } from "./auth.controller";
import { authLogin } from "./auth.validation";


const router = Router();

router.post( "/login", validateRequest( authLogin ), userLogin );

router.post( "/logout", checkAuth( UserRole.ADMIN, UserRole.DRIVER, UserRole.RIDER ), userLogout );

router.post( "/refresh-token", getNewAccessToken );

export const authRoute = router;