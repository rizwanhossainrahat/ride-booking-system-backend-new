import httpStatus from 'http-status-codes';
import jwt, { SignOptions } from "jsonwebtoken";
import { ZodError } from "zod";
import { AppError } from '../../config/errors/App.error';
import { UserRole } from '../modules/user/user.interface';
import { UserLike } from './service.util';

export const isZodError = (error: unknown): error is { issues: unknown[] } => {
    return error && typeof error === "object" && "issues" in error && Array.isArray(error.issues);
};

export function parseZodError(error: unknown): unknown[] {
    if (!(error instanceof ZodError)) return [];

    const formatted = error.format();
    const issues: unknown[] = [];

    for (const key in formatted) {
        if (key === "_errors") continue;

        const fieldErrors = formatted[key]?._errors;
        if (fieldErrors && fieldErrors.length > 0) {
            fieldErrors.forEach((msg: string) => {
                issues.push({
                    field: key,
                    message: msg,
                });
            });
        }
    }

    return issues;
};

export const generateToken = (
    payload: UserLike,
    secret: string,
    options?: SignOptions
): string => {
    return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string, secret: string) => {
    const verifiedToken = jwt.verify(token, secret);
    if (verifiedToken) {
        return verifiedToken;
    } else {
        throw new AppError(httpStatus.BAD_REQUEST, `Error in verify token`);
    }
};

interface SimpleLocation {
  lat: number;
  lng: number;
}

export const generateRandomDhakaLocations = async (): Promise<SimpleLocation> =>
{
  const count = 200;
  const centerLat = 23.8103;
  const centerLng = 90.4125;
  const maxOffset = 0.01;

  const locations: SimpleLocation[] = [];

  for ( let i = 0; i < count; i++ )
  {
    const latOffset = ( Math.random() - 0.5 ) * maxOffset * 2;
    const lngOffset = ( Math.random() - 0.5 ) * maxOffset * 2;

    const lat = parseFloat( ( centerLat + latOffset ).toFixed( 6 ) );
    const lng = parseFloat( ( centerLng + lngOffset ).toFixed( 6 ) );

    locations.push( {
      lat,
      lng,
    } );
  }

  const randomIndex = Math.floor( Math.random() * count );
  return locations[ randomIndex ];
};

export const isAllowedToUpdate = (
  currentRole: UserRole,
  currentUserId: string,
  targetRole: UserRole,
  targetUserId: string
) =>
{
  if ( currentRole === UserRole.ADMIN )
  {
    if ( targetRole === UserRole.ADMIN && targetUserId !== currentUserId )
    {
      return false;
    }
    return true;
  }

  if ( [ UserRole.RIDER, UserRole.DRIVER ].includes( currentRole ) )
  {
    return currentUserId === targetUserId;
  }

  return false;
};