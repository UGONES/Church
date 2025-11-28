import jwt from "jsonwebtoken";
import Message from "../models/Message.mjs";

export function initChat(io, { jwtSecret }) {
  io.on("connection", (socket) => {
    console.log("🔌 New socket connection:", socket.id);

    // Authenticate user from token
    const token = socket.handshake.auth?.token;
    if (token && jwtSecret) {
      try {
        const payload = jwt.verify(token, jwtSecret);
        socket.user = { 
          _id: payload._id, 
          name: payload.name, 
          role: payload.role, 
          email: payload.email 
        };
        
        // Join user room for private messages
        socket.join(`user:${socket.user._id}`);
        if (socket.user.role === "admin" || socket.user.role === "moderator") {
          socket.join("admins");
          console.log(`👑 Admin connected: ${socket.user.name}`);
        }
      } catch (e) {
        console.log("🔓 Guest user connected");
      }
    }

    // Everyone joins public room
    socket.join("public");

    // Send recent public messages
    const loadRecentMessages = async () => {
      try {
        const recentMessages = await Message.find({
          type: "public",
          isDeleted: false
        })
        .sort({ sentAt: -1 })
        .limit(50)
        .lean();
        
        socket.emit("public:history", recentMessages.reverse());
      } catch (error) {
        console.error("Error loading message history:", error);
      }
    };

    loadRecentMessages();

    // Public message handler
    socket.on("public:send", async (payload) => {
      if (!socket.user) {
        socket.emit("error", { 
          message: "Authentication required to send messages" 
        });
        return;
      }

      if (!payload.text?.trim()) {
        socket.emit("error", { 
          message: "Message cannot be empty" 
        });
        return;
      }

      const messageData = {
        text: payload.text.trim(),
        type: "public",
        userId: socket.user._id,
        userName: socket.user.name,
        userEmail: socket.user.email,
        sermonId: payload.sermonId || null,
        sentAt: new Date()
      };

      try {
        // Save to database
        const savedMessage = await Message.create(messageData);
        
        // Broadcast to all public room users
        io.to("public").emit("public:message", {
          _id: savedMessage._id,
          text: savedMessage.text,
          user: {
            id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          },
          date: savedMessage.sentAt,
          type: "public"
        });

      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("error", { 
          message: "Failed to send message" 
        });
      }
    });

    // Private message to admin
    socket.on("private:send", async (payload) => {
      if (!socket.user) {
        socket.emit("error", { 
          message: "Authentication required to send private messages" 
        });
        return;
      }

      if (!payload.text?.trim()) {
        socket.emit("error", { 
          message: "Message cannot be empty" 
        });
        return;
      }

      const messageData = {
        text: payload.text.trim(),
        type: "private",
        userId: socket.user._id,
        userName: socket.user.name,
        userEmail: socket.user.email,
        recipientId: payload.adminId || null,
        sentAt: new Date()
      };

      try {
        const savedMessage = await Message.create(messageData);
        
        // Send to admins room
        io.to("admins").emit("private:message", {
          _id: savedMessage._id,
          text: savedMessage.text,
          from: {
            id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email
          },
          date: savedMessage.sentAt,
          type: "private"
        });

        // Send confirmation to sender
        socket.emit("private:sent", { 
          success: true, 
          message: "Message sent to admin" 
        });

      } catch (error) {
        console.error("Error saving private message:", error);
        socket.emit("error", { 
          message: "Failed to send private message" 
        });
      }
    });

    // Admin reply to private message
    socket.on("admin:reply", async (payload) => {
      if (!socket.user || (socket.user.role !== "admin" && socket.user.role !== "moderator")) {
        socket.emit("error", { 
          message: "Admin privileges required" 
        });
        return;
      }

      const messageData = {
        text: payload.text,
        type: "private",
        userId: socket.user._id,
        userName: socket.user.name,
        userEmail: socket.user.email,
        recipientId: payload.userId,
        sentAt: new Date(),
        isRead: true
      };

      try {
        const savedMessage = await Message.create(messageData);
        
        // Send to specific user
        io.to(`user:${payload.userId}`).emit("private:message", {
          _id: savedMessage._id,
          text: savedMessage.text,
          from: {
            id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          },
          date: savedMessage.sentAt,
          type: "admin_reply"
        });

      } catch (error) {
        console.error("Error sending admin reply:", error);
        socket.emit("error", { 
          message: "Failed to send reply" 
        });
      }
    });

    // Live stream notifications
    socket.on("live:join", (sermonId) => {
      socket.join(`live:${sermonId}`);
    });

    socket.on("live:leave", (sermonId) => {
      socket.leave(`live:${sermonId}`);
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`🔴 User disconnected: ${socket.id} - ${reason}`);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  // Broadcast live stream events
  io.emitLiveEvent = (event, data) => {
    io.emit(`live:${event}`, data);
  };
}

export default initChat;