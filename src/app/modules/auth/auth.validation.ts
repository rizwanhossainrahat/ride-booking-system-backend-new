import z from "zod";

export const authLogin = z.object( {
    email: z.string()
        .email( "Invalid email address" )
        .min( 5, "Email must be at least 5 characters" )
        .max( 100, "Email cannot exceed 100 characters" ),
  
    password: z.string()
        .min( 8, "Password must be at least 8 characters" )
        .regex( /^(?=.*[A-Z])/, "Password must contain at least 1 uppercase letter" )
} );