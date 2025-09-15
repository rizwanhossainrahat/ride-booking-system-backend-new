import haversine from 'haversine-distance';
import httpStatus from 'http-status-codes';
import slugify from "slugify";
import { AppError } from '../../config/errors/App.error';

export const generateSlug = ( email: string, role: string ) =>
{
    const slugInput = `${ email }-${ role }`;

    return slugify( slugInput, { lower: true, strict: false } );
};

interface FareInput {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  durationInMin: number;
}

export const estimateFare = ( {
    startLat,
    startLng,
    endLat,
    endLng,
    durationInMin,
}: FareInput ) =>
{
    const distance = haversine(
        { lat: startLat, lng: startLng },
        { lat: endLat, lng: endLng }
    ) / 1000;

    const baseFare = 50;
    const perKm = 20;
    const perMin = 2;

    const totalFare = baseFare + distance * perKm + durationInMin * perMin;

    return {
        distance: Number( distance.toFixed( 2 ) ),
        durationInMin,
        estimatedFare: Math.ceil( totalFare ),
    };
};

export async function reverseGeocode ( lat: number, lng: number )
{
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${ lat }&lon=${ lng }`;

    try
    {
        const res = await fetch( url, {
            headers: {
                "User-Agent": "reverse-geo-script"
            }
        } );

        const data = await res.json();

        return {
            displayName: data.display_name,
            address: data.address,
            lat: parseFloat( data.lat ),
            lng: parseFloat( data.lon ),
        };
    } catch ( error: unknown )
    {
        throw new AppError(httpStatus.EXPECTATION_FAILED,  `Location failed to be fetched!!, ${error}`)
    }
};