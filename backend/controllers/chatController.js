// backend/controllers/chatController.js
const chatService = require("../services/chatService");
const path = require("path");
const fs   = require("fs");

class ChatController {
  // GET /api/admin/conversations
  async getAdminConversations(req, res) {
    try {
      const { search = "" } = req.query;
      const convs = await chatService.getAllConversations(req.user.id, search);
      res.json({ success: true, conversations: convs });
    } catch (err) {
      console.error("getAdminConversations:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/institute/conversation
  async getInstituteConversation(req, res) {
    try {
      const conv = await chatService.getInstituteConversation(req.user.id);
      res.json({ success: true, conversation: conv });
    } catch (err) {
      console.error("getInstituteConversation:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // POST /api/admin/conversations/start/:instituteId
  async startConversation(req, res) {
    try {
      const instituteId = parseInt(req.params.instituteId);
      if (isNaN(instituteId)) return res.status(400).json({ success: false, message: "Invalid institute ID" });
      const conv = await chatService.startConversation(req.user.id, instituteId);
      res.json({ success: true, conversation: conv });
    } catch (err) {
      console.error("startConversation:", err);
      const code = err.message === "Institute not found" ? 404 : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  // GET /api/messages/:conversationId
  async getMessages(req, res) {
    try {
      const convId = parseInt(req.params.conversationId);
      const { page = 1, limit = 50 } = req.query;
      if (isNaN(convId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });
      const result = await chatService.getMessages(convId, req.user.id, parseInt(page), parseInt(limit));
      res.json({ success: true, ...result });
    } catch (err) {
      console.error("getMessages:", err);
      const code = err.message === "Conversation not found" ? 404
        : err.message === "Access denied" ? 403 : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  // POST /api/messages/:conversationId
  async sendMessage(req, res) {
    try {
      const convId = parseInt(req.params.conversationId);
      if (isNaN(convId)) return res.status(400).json({ success: false, message: "Invalid conversation ID" });

      const { message_text, file_url, file_type, file_name } = req.body;

      // Sanitize text
      const text = message_text ? String(message_text).trim().slice(0, 2000) : null;
      if (!text && !file_url) {
        return res.status(400).json({ success: false, message: "Message must contain text or a file" });
      }

      const msg = await chatService.sendMessage(convId, req.user.id, {
        message_text: text,
        file_url,
        file_type,
        file_name,
      });

      // Emit via socket if available
      const io = req.app.get("io");
      if (io) {
        io.to(`conv_${convId}`).emit("receive_message", msg);
      }

      res.status(201).json({ success: true, message: msg });
    } catch (err) {
      console.error("sendMessage:", err);
      const code = err.message === "Conversation not found" ? 404
        : err.message === "Access denied" ? 403
        : err.message.includes("must contain") ? 400 : 500;
      res.status(code).json({ success: false, message: err.message });
    }
  }

  // POST /api/messages/upload
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      let file_type = "image";
      if (ext === ".pdf") file_type = "pdf";
      else if (ext === ".csv") file_type = "csv";

      const file_url = `/uploads/chat/${req.file.filename}`;
      res.json({
        success: true,
        file_url,
        file_type,
        file_name: req.file.originalname,
      });
    } catch (err) {
      console.error("uploadFile:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // GET /api/chat/unread-count
  async getUnreadCount(req, res) {
    try {
      const count = await chatService.getUnreadCount(req.user.id);
      res.json({ success: true, count });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ChatController();
