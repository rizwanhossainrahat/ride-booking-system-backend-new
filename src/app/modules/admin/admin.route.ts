import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.middleware";
import { checkUpdatePermission } from "../../middlewares/checkUpdatePermission.middleware";
import { UserRole } from "../user/user.interface";
import { approvalDriver, blockUserById, deleteBlockedUser, deleteRide, getAllDrivers, getAllRides, getAllUsers, getDriverById, getRideById, getUserById, suspendDriverById } from "./admin.controller";

const router = Router();

router.get( "/user/all", checkAuth( UserRole.ADMIN ), getAllUsers );
router.get( "/user/:id", getUserById );

router.get( "/driver/all", checkAuth( UserRole.ADMIN ), getAllDrivers );
router.get( "/driver/:id", checkAuth( UserRole.ADMIN ), getDriverById );

router.get( "/all-rides", checkAuth( UserRole.ADMIN ), getAllRides ); 
router.get( "/ride/:id", checkAuth( UserRole.ADMIN, UserRole.DRIVER, UserRole.RIDER ), getRideById );

router.patch( "/suspend-driver/:id/:suspendParam", checkAuth( UserRole.ADMIN ),checkUpdatePermission, suspendDriverById );

router.patch( "/block-user/:id/:blockParam", checkAuth( UserRole.ADMIN ),checkUpdatePermission, blockUserById );

router.patch( "/approve-driver/:id/:approveParam",  checkAuth( UserRole.ADMIN ),checkUpdatePermission, approvalDriver ); 

router.delete( "/delete-blocked-user/:id",  checkAuth( UserRole.ADMIN ),checkUpdatePermission, deleteBlockedUser );

router.delete( "/ride/:id", checkAuth( UserRole.ADMIN ), checkUpdatePermission, deleteRide );


export const adminRoutes = router;