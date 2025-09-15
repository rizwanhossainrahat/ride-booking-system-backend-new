import { z } from "zod";

export const zodRideRequest = z.object( {
    lat: z.number().min( -90 ).max( 90 ),
    lng: z.number().min( -180 ).max( 180 ),
    fare: z.any(),
    picLat: z.number().min( -90 ).max( 90 ).optional(),
    picLng: z.number().min( -180 ).max( 180 ).optional(),
    distanceInKm: z.number().optional()
} );

export const ratingZodSchema = z.object( {
    rating: z.number().min( 1 ).max( 5 ),
} );