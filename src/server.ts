import http from "http";
import { Socket, Server as SocketIOServer } from "socket.io";
import app from "./app/app";
import { RideStatus } from "./app/modules/ride/ride.interface";
import { Ride } from "./app/modules/ride/ride.model";
import { ILocation } from "./app/modules/user/user.interface";
import { User } from "./app/modules/user/user.model";
import { dbConnect } from "./config/db/mongoos.config";

interface IUserLocation {
    userId: string;
    coordinates: [number, number];
    address?: string;
}

const startServer = async () => {
    try {
        await dbConnect();

        // Wrap Express app in HTTP server
        const server = http.createServer(app);

        // Attach Socket.IO
        const io = new SocketIOServer(server, {
            cors: { origin: [ "http://localhost:5173"] },
            // cors: { origin: ["http://localhost:5173"] },
        });

        io.on("connection", (socket: Socket) => {
            console.log("Client connected 😎 :", socket.id);

            // Listen for location updates
            socket.on("update-location", async (data: IUserLocation) => {
                console.log("Received location:", data);

                if (data?.userId) {
                    try {
                        const locationPayload: ILocation = {
                            type: 'Point',
                            coordinates: [data.coordinates[0], data.coordinates[1]],
                            address: data.address
                        };

                        // Save/update in DB
                        const user = await User.findOneAndUpdate(
                            { _id: data.userId },
                            { $set: { location: locationPayload } },
                            { upsert: true, new: true }
                        );

                        // console.log(user.driver)

                        if (user?.driver) {
                            const checkRide = await Ride.findOne({ driver: user.driver, status: RideStatus.REQUESTED });
                            // console.log(checkRide)

                            if (checkRide && checkRide.status === "REQUESTED") {
                                const updatedDriverLocation = await Ride.findOneAndUpdate(
                                    { _id: checkRide._id },
                                    { $set: { driverLocation: locationPayload } },
                                    { upsert: true, new: true }
                                );

                                console.log("Updated driver location:", updatedDriverLocation.driverLocation);
                            }
                        }

                        // console.log(locationPayload)
                    }
                    catch (err) {
                        console.error("Failed to save location:", err);
                    }

                    // Broadcast to other clients
                    socket.broadcast.emit("user-location-updated", data);
                }
                else {
                    console.log("User not mentioned!")
                    socket.on("disconnect", () => {
                        console.log("Client disconnected:", socket.id);
                    });
                }
            });

            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });

        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Ride Booking Server is listening at http://localhost:${PORT} 😁`);
        });
    } catch (error) {
        console.error(error);
    }
};

startServer();