import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    auth: {
        token: localStorage.getItem("token"),
    },
});

export default socket;