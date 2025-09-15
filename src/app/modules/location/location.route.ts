import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.middleware";
import { UserRole } from "../user/user.interface";
import { getDirection, searchLocation } from "./location.controller";

const router = Router();

router.post( "/search", checkAuth( UserRole.RIDER, UserRole.ADMIN, UserRole.DRIVER ), searchLocation );

router.post( "/get-direction", checkAuth( UserRole.RIDER, UserRole.ADMIN, UserRole.DRIVER ), getDirection );

export const locationRouter = router;