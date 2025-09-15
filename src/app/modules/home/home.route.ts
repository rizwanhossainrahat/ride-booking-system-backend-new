import { Router } from "express";
import { homeRoute } from "./home.controller";


export const homeRouter = Router();


homeRouter.get( "/", homeRoute );