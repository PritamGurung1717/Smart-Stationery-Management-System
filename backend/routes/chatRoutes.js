// backend/routes/chatRoutes.js
const express    = require("express");
const router     = express.Router();
const ctrl       = require("../controllers/chatController");
const { auth, adminAuth, instituteAuth } = require("../middleware/auth");
const { handleChatFileUpload } = require("../middleware/uploadMiddleware");

// ── File upload (must be BEFORE /:conversationId to avoid param conflict) ──
router.post("/messages/upload", auth, handleChatFileUpload, ctrl.uploadFile.bind(ctrl));

// ── Admin routes ──────────────────────────────────────────────
router.get("/admin/conversations", adminAuth, ctrl.getAdminConversations.bind(ctrl));
router.post("/admin/conversations/start/:instituteId", adminAuth, ctrl.startConversation.bind(ctrl));

// ── Institute routes ──────────────────────────────────────────
router.get("/institute/conversation", instituteAuth, ctrl.getInstituteConversation.bind(ctrl));

// ── Shared message routes (admin OR institute) ────────────────
router.get("/messages/:conversationId", auth, ctrl.getMessages.bind(ctrl));
router.post("/messages/:conversationId", auth, ctrl.sendMessage.bind(ctrl));

// ── Unread count ──────────────────────────────────────────────
router.get("/chat/unread-count", auth, ctrl.getUnreadCount.bind(ctrl));

module.exports = router;
