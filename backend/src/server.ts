import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initSocket } from "./socket/index.js";
import "dotenv/config"

const PORT = 3000;


const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
initSocket(io)
// Start listening
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
