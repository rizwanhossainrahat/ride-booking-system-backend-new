import { z } from "zod";

export const vehicleInfoZodSchema = z.object( {
    license: z.string().min( 1, { message: "License is required" } ),
    model: z.string().min( 1, { message: "Model is required" } ),
    plateNumber: z.string().min( 1, { message: "Plate number is required" } ),
} ).refine(
    ( data ) => Object.keys( data ).some( ( key ) => data[ key as keyof typeof data ] !== undefined ),
    {
        message: "At least one field must be provided for update",
    }
);