// frontend/src/services/socketService.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  if (!token || token === "null") return null;

  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => console.log("💬 Socket connected:", socket.id));
  socket.on("connect_error", (err) => console.warn("Socket error:", err.message));
  socket.on("disconnect", () => console.log("💬 Socket disconnected"));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
