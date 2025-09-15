import { JwtPayload } from "jsonwebtoken";
import { ILocation, UserRole } from "../../app/modules/user/user.interface";

declare global {
  namespace Express {
    interface User extends JwtPayload {
      userId?: string;
      role?: UserRole;
      username?: string;
      email?: string;
      name?: string;
    }

    interface Request {
      user?: User;
      userLocation?: ILocation | undefined;
      activeDriverPayload?: Record<string, string | number | object>[];
      targetUser?: any;
    }
  }
}