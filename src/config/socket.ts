import { Application } from "express";
import http from "http";
import { Socket, Server as SocketIOServer } from "socket.io";
import { ILocation } from "../app/modules/user/user.interface";
import { User } from "../app/modules/user/user.model";

interface IUserLocation {
  userId: string;
  coordinates: [number, number];
  address?: string;
}


export const socketFunction = async ( app: Application )=>
{
    const server = http.createServer( app );
    
            // Attach Socket.IO
    const io = new SocketIOServer( server, {
        cors: { origin: "https://choloride-frontend.vercel.app" },
        // cors: { origin: "http://localhost:5173" },
    } );
    
    io.on( "connection", ( socket: Socket ) =>
    {
        console.log( "Client connected:", socket.id );
    
        // Listen for location updates
        socket.on( "update-location", async ( data: IUserLocation ) =>
        {
            console.log( "Received location:", data );
    
            try
            {
                const locationPayload: ILocation = {
                    type: 'Point',
                    coordinates: [ data.coordinates[ 0 ], data.coordinates[ 1 ] ],
                    address: data.address
                };
    
                // Save/update in DB
                const user = await User.findOneAndUpdate(
                    { _id: data.userId },
                    { $set: { location: locationPayload } },
                    { upsert: true, new: true }
                );
    
                console.log( locationPayload )
            }
            catch ( err )
            {
                console.error( "Failed to save location:", err );
            }
    
            // Broadcast to other clients
            socket.broadcast.emit( "user-location-updated", data );
        } );
    
        socket.on( "disconnect", () =>
        {
            console.log( "Client disconnected:", socket.id );
        } );
    } );
}