import { Types } from "mongoose";
import { IRatings } from "../driver/river.interface";
import { ILocation } from "../user/user.interface";

export enum RideStatus {
  REQUESTED = "REQUESTED",
  ACCEPTED = "ACCEPTED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum CancelledBy {
  RIDER = "RIDER",
  DRIVER = "DRIVER",
  ADMIN = "ADMIN",
}

export interface IRide {
  rider: Types.ObjectId;
  expiresAt: Date | null;
  driver?: Types.ObjectId; 
  pickUpLocation: ILocation;
  dropOffLocation: ILocation;
  driverLocation: ILocation;
  riderUserName: string;
  driverUserName: string;
  fare: number;
  status: RideStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: CancelledBy;
  distanceInKm?: number;
  durationInMin?: number;
  rating?: IRatings;
  createdAt?: Date;
};