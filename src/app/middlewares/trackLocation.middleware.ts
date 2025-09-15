import { NextFunction, Request, Response } from "express";
import { ILocation } from "../modules/user/user.interface";
import { asyncHandler } from "../utils/controller.util";
import { reverseGeocode } from "../utils/helperr.util";
import { generateRandomDhakaLocations } from "../utils/middleware.util";

export const trackLocationByLatLng = asyncHandler( async ( req: Request, res: Response, next: NextFunction ) =>
{
    const { lat, lng } = await generateRandomDhakaLocations();

    if ( !lat || !lng ) return next();

    // Convert to numbers safely
    const latNum = typeof lat === 'string' ? parseFloat( lat ) : Number( lat );
    const lngNum = typeof lng === 'string' ? parseFloat( lng ) : Number( lng );

    if ( isNaN( latNum ) || isNaN( lngNum ) ) return next();

    const geo = await reverseGeocode( latNum, lngNum );
    
    if ( geo )
    {
        const locationPayload: ILocation = {
            type: 'Point',
            coordinates: [ lngNum, latNum ],
            address: geo.displayName
        };
        
        req.userLocation = locationPayload;
        req.headers[ "x-user-location" ] = JSON.stringify( geo );
    }

    next();
} );