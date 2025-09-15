import z from "zod";
import { DriverStatus } from "../driver/river.interface";
import { UserRole } from "./user.interface";

export const vehicleInfoSchema = z.object({
    license: z.string()
        .min(3, "License must be at least 3 characters long"),
    model: z.string(),
    plateNumber: z.string()
        .min(3, "Plate number must be at least 3 characters long")
});

export const locationZodSchema = z.object({
    type: z.literal("Point").default("Point"),
    coordinates: z.tuple([z.number(), z.number()]).default([0, 0]),
    address: z.string().optional(),
});


export const zodUserSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters"),

    email: z.string()
        .email("Invalid email address format")
        .min(5, "Email must be at least 5 characters long")
        .max(100, "Email cannot exceed 100 characters"),

    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/^(?=.*[A-Z])/, "Password must contain at least 1 uppercase letter"),

    role: z.string()
        .transform((val) => val.toUpperCase())
        .refine((val) => Object.values(UserRole).includes(val as UserRole), {
            message: "role must be ADMIN | RIDER | DRIVER",
        })
        .transform((val) => val as UserRole),

    vehicleInfo: vehicleInfoSchema.optional(),

    driverStatus: z.nativeEnum(DriverStatus)
        .default(DriverStatus.AVAILABLE)
        .optional(),
    location: locationZodSchema.optional(),

}).superRefine((data, ctx) => {
    if (data.role === UserRole.DRIVER && !data.vehicleInfo) {
        ctx.addIssue({
            path: ['vehicleInfo'],
            code: z.ZodIssueCode.custom,
            message: 'Vehicle info is required for drivers',
        });
    }

    if (data.role !== UserRole.DRIVER && data.vehicleInfo) {
        delete data.vehicleInfo;
    }
});


export const updateUserZodSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name cannot exceed 50 characters")
        .optional(),

    newPassword: z.string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/^(?=.*[A-Z])/, "Password must contain at least 1 uppercase letter")
        .optional(),
    oldPassword: z.string().optional(),
    location: locationZodSchema.optional(),

}).refine((data) => {
    if (data.newPassword && !data.oldPassword) return false;
    return true;
}, {
    message: "old password is required when changing password",
    path: ["oldPassword"],
})
    .refine(
        data => Object.values(data).some(val => val !== undefined),
        "At least one field must be provided for update"
    );