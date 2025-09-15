/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from "dotenv";
import { EnvString } from "./interfaces/types.config";

dotenv.config();

export const envStrings: EnvString = {
    PORT: process.env.PORT!,
    DB_URL: process.env.DB_URL!,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    BCRYPT_SALT: process.env.BCRYPT_SALT!,
    ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE!,
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE!,
    LOCATIONIQ_API_KEY: process.env.LOCATIONIQ_API_KEY!,
    GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY!,
};