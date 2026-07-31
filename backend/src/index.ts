import { resolve } from "node:path";
import { startApi } from "./api";

const port = Number(process.env.PORT ?? 3000);
const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/app.sqlite");
const corsOrigin = process.env.CORS_ORIGIN;

startApi({ port, databasePath, corsOrigin });
