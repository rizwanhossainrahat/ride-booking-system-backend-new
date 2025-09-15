import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth.middleware";
import { checkUpdatePermission } from "../../middlewares/checkUpdatePermission.middleware";
import { validateRequest } from "../../middlewares/validateReq.middleware";
import { createUser, getMe, getUserStats, updateUser } from "./user.controller";
import { UserRole } from "./user.interface";
import { updateUserZodSchema, zodUserSchema } from "./user.validation";

const router = Router();

router.post( "/create", validateRequest( zodUserSchema ), createUser );

router.get(
  "/me", 
  checkAuth(UserRole.ADMIN, UserRole.DRIVER, UserRole.RIDER),  
  getMe
);

router.patch(
  "/update-user/:id", 
  checkAuth(UserRole.ADMIN, UserRole.DRIVER, UserRole.RIDER),
  validateRequest(updateUserZodSchema), 
  checkUpdatePermission, 
  updateUser
);

router.get( "/user-stats", checkAuth( UserRole.ADMIN, UserRole.RIDER ), getUserStats );

export const userRoute = router;