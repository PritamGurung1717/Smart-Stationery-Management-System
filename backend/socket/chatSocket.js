// backend/socket/chatSocket.js
const jwt          = require("jsonwebtoken");
const User         = require("../models/user");
const Conversation = require("../models/conversation");
const chatService  = require("../services/chatService");

// Map userId → socketId for online status
const onlineUsers = new Map();

module.exports = (io) => {
  // ── Auth middleware for socket connections ──────────────────
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token || "";
      while (/^Bearer\s+/i.test(token)) token = token.replace(/^Bearer\s+/i, "").trim();

      if (!token || token === "null") return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      const user = await User.findOne({ id: decoded.id, "tokens.token": token });
      if (!user) return next(new Error("Invalid token"));
      if (user.status === "suspended") return next(new Error("Account suspended"));

      // Only admin and institute can use chat socket
      if (!["admin", "institute"].includes(user.role)) {
        return next(new Error("Access denied"));
      }

      socket.user = { id: user.id, role: user.role, name: user.name };
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { id: userId, role } = socket.user;
    onlineUsers.set(userId, socket.id);

    console.log(`💬 Chat socket connected: user ${userId} (${role})`);

    // Broadcast online status to relevant rooms
    socket.broadcast.emit("user_online", { userId });

    // ── Join conversation room ──────────────────────────────
    socket.on("join_conversation", async ({ conversation_id }) => {
      try {
        const convId = parseInt(conversation_id);
        const conv = await Conversation.findOne({ id: convId });
        if (!conv) return socket.emit("error", { message: "Conversation not found" });

        if (conv.institute_id !== userId && conv.admin_id !== userId) {
          return socket.emit("error", { message: "Access denied" });
        }

        socket.join(`conv_${convId}`);
        socket.emit("joined_conversation", { conversation_id: convId });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── Send message via socket ─────────────────────────────
    socket.on("send_message", async ({ conversation_id, message_text, file_url, file_type, file_name }) => {
      try {
        const convId = parseInt(conversation_id);
        const msg = await chatService.sendMessage(convId, userId, {
          message_text,
          file_url,
          file_type,
          file_name,
        });

        // Broadcast to everyone in the room (including sender for confirmation)
        io.to(`conv_${convId}`).emit("receive_message", msg);
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── Typing indicator ────────────────────────────────────
    socket.on("typing", ({ conversation_id, is_typing }) => {
      socket.to(`conv_${conversation_id}`).emit("typing", {
        userId,
        name: socket.user.name,
        is_typing,
      });
    });

    // ── Mark messages as read ───────────────────────────────
    socket.on("read_message", async ({ conversation_id }) => {
      try {
        await chatService.markAsRead(parseInt(conversation_id), userId);
        socket.to(`conv_${conversation_id}`).emit("messages_read", {
          conversation_id,
          reader_id: userId,
        });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── Disconnect ──────────────────────────────────────────
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user_offline", { userId });
      console.log(`💬 Chat socket disconnected: user ${userId}`);
    });
  });

  // Helper to check if a user is online
  io.isOnline = (userId) => onlineUsers.has(userId);
};
