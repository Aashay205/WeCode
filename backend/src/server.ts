import http from "http";
import { Server } from "socket.io";
import app, { allowedOrigins } from "./app.js";
import { initSocket } from "./socket/index.js";
import { verifyToken } from "./services/auth.js";
import type { AuthUser } from "./types/auth.js";
import "dotenv/config"

const PORT = 3000;


const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string") {
    next(new Error("Authentication required"));
    return;
  }

  try {
    const payload = verifyToken(token);
    socket.data.user = { userId: payload.userId, username: payload.username } satisfies AuthUser;
    next();
  } catch {
    next(new Error("Invalid authentication token"));
  }
});
initSocket(io)
// Start listening
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
