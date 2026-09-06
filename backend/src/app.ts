import express from "express"
import cors from "cors";
import authRouter from "./routes/auth.js";
import roomsRouter from "./routes/rooms.js";

export const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost,http://localhost:5173")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const app=express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json())
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);

export default app;