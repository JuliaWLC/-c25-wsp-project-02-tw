import express from "express";
import path from "path";
import expressSession from "express-session";
import grant from "grant";
import dotenv from "dotenv";
dotenv.config();

import config from "./knexfile";
import Knex from "knex";
const knex = Knex(config[process.env.NODE_ENV || "development"]);

const grantExpress = grant.express({
  defaults: {
    origin: "44.199.150.85",
    transport: "session",
    state: true,
  },
  google: {
    key: process.env.GOOGLE_CLIENT_ID || "",
    secret: process.env.GOOGLE_CLIENT_SECRET || "",
    scope: ["profile", "email"],
    callback: "/usersLogin/google",
  },
});

declare module "express-session" {
  interface SessionData {
    userIsLoggedIn?: boolean;
    driverIsLoggedIn?: boolean;
    users_id: number;
    drivers_id: number;
    firstName: string;
    loginType: string;
    email: string;
  }
}

const app = express();

// Section 1: Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  expressSession({
    secret: "group 4 is the best",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(grantExpress as express.RequestHandler);

// logging 用 middleware
app.use((req, _res, next) => {
  logger.debug(`Request - Path ${req.path}, Method: ${req.method}`);
  next();
});

// Controllers
import { UsersController } from "./controllers/UsersController";
import { DriversController } from "./controllers/DriversController";
import { ReceiversController } from "./controllers/ReceiversController";
import { UsersMainController } from "./controllers/usersMainController"
import { DriversMainController } from "./controllers/DriversMainController";


// Services
import { UsersService } from "./services/UsersService";
import { DriversService } from "./services/DriversService";
import { ReceiversService } from "./services/ReceiversService";
import {UsersMainService} from "./services/UsersMainService"
import { DriversMainService } from "./services/DriversMainService";

const usersService = new UsersService(knex);
export const usersController = new UsersController(usersService);

const driversService = new DriversService(knex);
export const driversController = new DriversController(driversService);

const receiversService = new ReceiversService(knex);
export const receiversController = new ReceiversController(receiversService);

const usersMainService = new UsersMainService(knex)
export const usersMainController = new UsersMainController(usersMainService)

const driversMainService = new DriversMainService(knex);
export const driversMainController = new DriversMainController(driversMainService);

// Section 2: Route Handlers
// import { authRoutes } from "./routers/authRoutes";
import { usersRoutes } from "./routers/usersRoutes";
import { driversRoutes } from "./routers/driversRoutes";
import { driversMainRoutes } from "./routers/driversMainRoutes";
import { usersMainRoutes } from "./routers/usersMainRoutes";
import {
  driverIsLoggedInApi,
  userIsLoggedInApi,
  guardDriversMiddleware,
  guardUsersMiddleware,
} from "./utils/guard";
import { receiverRoutes } from "./routers/receiversRoutes";
import { logger } from "./utils/logger";
import { logoutRoutes } from "./utils/logout";

// app.use("/login", authRoutes);
app.use("/userslogin", usersRoutes);
app.use("/driverslogin", driversRoutes);
app.use("/driversMain", driverIsLoggedInApi, driversMainRoutes);
app.use("/users", userIsLoggedInApi, usersMainRoutes);
app.use("/receivertoken", receiverRoutes);
app.use("/logout", logoutRoutes);

// Section 3: Serve
app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/private/usersAssets",
  guardUsersMiddleware,
  express.static(path.join(__dirname, "private", "assets"))
);
app.use(
  "/private/driversAssets",
  guardDriversMiddleware,
  express.static(path.join(__dirname, "private", "assets"))
);
app.use(
  "/private/usersPrivate",
  guardUsersMiddleware,
  express.static(path.join(__dirname, "private", "usersPrivate"))
);
app.use(
  "/private/driversPrivate",
  guardDriversMiddleware,
  express.static(path.join(__dirname, "private", "driversPrivate"))
);

// Section 4: Error Handling
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "404.html"));
  // res.redirect("/404.html")
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}/`);
});
