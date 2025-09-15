import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from "express";
import expressSession from "express-session";
import passport from 'passport';
import "../config/auth/passport.config";
import { globalErrorResponse } from './middlewares/globalError.middleware';
import { globalNotFoundResponse } from './middlewares/notFoundRoute.middleware';
import { homeRoute } from './modules/home/home.controller';
import { adminRouter } from './routes/admin.route';
import { firstVersionRouter } from './routes/module.route';
import { riderRouter } from './routes/service.route';

const app: Application = express();

// app.use( expressSession( {
//     secret: "my-secret",
//     resave: true,
//     saveUninitialized:false
// } ) );

app.use( expressSession( {
    secret: "my-secret",
    resave: true,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: "none",
        httpOnly: true,
    }
} ) );


app.use( passport.initialize() );
app.use( passport.session() );
app.use( cookieParser() );
app.use( express.json() );
app.use( cors( {
    origin: ["http://localhost:5173"],
    // origin: ["http://localhost:5173",],
    credentials: true
}) );


// // user set offline job --> corn
// scheduleUserOfflineJob()

// professional route
app.get( "/", homeRoute )
app.use( "/api", firstVersionRouter )
app.use( "/api", adminRouter );
app.use( "/api", riderRouter );

// global not found routes
app.use( globalNotFoundResponse )

// global error handler
app.use(globalErrorResponse)


export default app;