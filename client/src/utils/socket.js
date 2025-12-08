// src/utils/socket.js
import { io } from "socket.io-client";
import useAuth from "../hooks/useAuth";

let socket = null;

/**
 * Connect to Socket.IO server
 * @param {Object} options
 * @param {string} [options.token] - JWT token for authentication
 */
export function connectSocket( {token} = useAuth()) {
  // If socket already exists, update token if changed
  if (socket && socket.connected) {
    if (token && socket.auth?.token !== token) {
      console.log("🔄 Updating socket auth token...");
      socket.auth = { token };
      socket.disconnect().connect();
    }
    return socket;
  }

  const serverUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  // ✅ Initialize socket connection
  socket = io(serverUrl, {
    autoConnect: false, // prevent race conditions
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    withCredentials: true,
  });

  // ====== EVENT HANDLERS ======
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message);
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log(`♻️ Reconnection attempt ${attempt}...`);
  });

  socket.connect(); // ✅ Connect after setup

  return socket;
}

/**
 * Get existing socket instance
 */
export function getSocket() {
  if (!socket) {
    console.warn("⚠️ Socket not connected yet. Call connectSocket() first.");
  }
  return socket;
}

/**
 * Safely disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
}
