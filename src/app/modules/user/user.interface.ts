import { Schema } from 'mongoose';
import { IDriver } from '../driver/river.interface';
import { IRide } from '../ride/ride.interface';

export enum UserRole {
  RIDER = "RIDER",
  ADMIN = "ADMIN",
  DRIVER = "DRIVER"
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number];
  address?: string;
}

export interface VehicleInfo {
  license: string;
  model: string;
  plateNumber: string;
}

export interface IUser {
  name: string;
  email: string;
  username?: string;
  password: string;
  role: UserRole;
  isBlocked: boolean;
  isOnline: boolean;
  driver?: Schema.Types.ObjectId | IDriver;
  lastOnlineAt?: Date;
  location?: ILocation;
  vehicleInfo?: VehicleInfo; 
  rideDetails?: IRide[];
  
  ridings?: {
    rideId?: Schema.Types.ObjectId;
    driverId?: Schema.Types.ObjectId;
  };
  
  isModified(path?: string): boolean;
  isNew?: boolean;
}