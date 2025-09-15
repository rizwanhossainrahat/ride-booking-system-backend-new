import axios from "axios";
import { Request, Response } from "express";
import httpStatus from 'http-status-codes';
import { envStrings } from "../../../config/env.config";
import { AppError } from "../../../config/errors/App.error";
import { asyncHandler, responseFunction } from "../../utils/controller.util";

export const searchLocation = asyncHandler( async ( req: Request, res: Response ) =>
{
    try
    {
        // console.log( req.userLocation, req.body )
        const userLocation = req.userLocation;
        const { query_text } = req.body;

        
        if ( !query_text )
            {
                throw new AppError( httpStatus.BAD_REQUEST, "Invalid Body" )
            }
        
        const response = await axios.get(
            // `https://api.geoapify.com/v1/geocode/search?text=${ query_text }&format=json&apiKey=${envStrings.GEOAPIFY_API_KEY}`,
            `https://api.opencagedata.com/geocode/v1/json?key=5fffe2263ef04953b4a7206d906188d4&q=${ query_text }&pretty=1&no_annotations=1`
            // `https://api.opencagedata.com/geocode/v1/json?key=5fffe2263ef04953b4a7206d906188d4&q=${ query_text }&pretty=1&no_annotations=1`
            );
            console.log("text query form frontend response",response)

        // console.log(response.data)
        const result = response.data;
        // console.log(result)

        responseFunction( res, {
            data: result.results,
            message: "search result",
            statusCode: httpStatus.OK
        } );

    } catch ( error: unknown )
    {
        // console.log(error)
        if ( error instanceof Error )
        {
            console.error( "Location search error:", error.message );
        } else
        {
            console.error( "Location search error: Unknown error", error );
        }
        throw new AppError( httpStatus.BAD_REQUEST, "Location search error" )
    }
} );

const LOCATIONIQ_API_KEY = "pk.8e304f61cd0d79b2339f0aedc14686cc"
const LOCATIONIQ_BASE_URL = "https://us1.locationiq.com/v1";

export const getDirection = asyncHandler( async ( req: Request, res: Response ) =>
{
    try
    {
        const { profile, coordinates, alternatives, steps, overview } = req.body;

        if ( !profile || !coordinates )
        {
            throw new AppError( httpStatus.BAD_REQUEST, "Bad request body for direction" )
        }

       

        const url = `${ LOCATIONIQ_BASE_URL }/directions/${ profile }/${ coordinates }`;

        const response = await axios.get( url, {
            params: {
                key: LOCATIONIQ_API_KEY,
                alternatives: alternatives || false,
                steps: steps || false,
                overview: overview || "simplified",
            },
        } );

        // console.log( response );

        responseFunction( res, {
            statusCode: httpStatus.OK,
            message: "Route retrieved successfully",
            data: response.data,
        } );

    } catch ( error: unknown )
    {

        if ( axios.isAxiosError( error ) )
        {
            console.error( "LocationIQ Directions Error:", error.response?.data || error.message );
        } else if ( error instanceof Error )
        {
            console.error( "LocationIQ Directions Error:", error.message );
        } else
        {
            console.error( "LocationIQ Directions Error: Unknown error", error );
        }

        throw new AppError( httpStatus.BAD_REQUEST, "Error on destination finding!!" )
    }
} );