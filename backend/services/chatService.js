// backend/services/chatService.js
const Conversation = require("../models/conversation");
const ChatMessage  = require("../models/chatMessage");
const Counter      = require("../models/counter");
const User         = require("../models/user");

class ChatService {
  // ── Counters ──────────────────────────────────────────────────
  async nextId(key) {
    const c = await Counter.findByIdAndUpdate(
      { _id: key },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return c.sequence_value;
  }

  // ── Get or create conversation ────────────────────────────────
  async getOrCreateConversation(instituteId, adminId) {
    let conv = await Conversation.findOne({ institute_id: instituteId, admin_id: adminId });
    if (!conv) {
      const id = await this.nextId("conversationId");
      conv = await Conversation.create({ id, institute_id: instituteId, admin_id: adminId });
    }
    return conv;
  }

  // ── Admin: list all conversations ─────────────────────────────
  async getAllConversations(adminId, search = "") {
    const convs = await Conversation.find({ admin_id: adminId })
      .sort({ last_message_at: -1, created_at: -1 })
      .lean();

    const results = await Promise.all(
      convs.map(async (c) => {
        const institute = await User.findOne({ id: c.institute_id })
          .select("id name email instituteInfo").lean();
        const unread = await ChatMessage.countDocuments({
          conversation_id: c.id,
          sender_id: c.institute_id,
          is_read: false,
        });
        return { ...c, institute, unread_count: unread };
      })
    );

    if (search) {
      const q = search.toLowerCase();
      return results.filter(
        (r) =>
          r.institute?.name?.toLowerCase().includes(q) ||
          r.institute?.email?.toLowerCase().includes(q) ||
          r.institute?.instituteInfo?.schoolName?.toLowerCase().includes(q)
      );
    }
    return results;
  }

  // ── Institute: get own conversation ───────────────────────────
  async getInstituteConversation(instituteId) {
    // Find the admin user
    const admin = await User.findOne({ role: "admin" }).select("id name").lean();
    if (!admin) throw new Error("No admin found");

    const conv = await this.getOrCreateConversation(instituteId, admin.id);
    const unread = await ChatMessage.countDocuments({
      conversation_id: conv.id,
      sender_id: admin.id,
      is_read: false,
    });
    return { ...conv.toObject(), admin, unread_count: unread };
  }

  // ── Admin: start conversation with institute ──────────────────
  async startConversation(adminId, instituteId) {
    const institute = await User.findOne({ id: instituteId, role: "institute" });
    if (!institute) throw new Error("Institute not found");
    return this.getOrCreateConversation(instituteId, adminId);
  }

  // ── Get messages for a conversation ──────────────────────────
  async getMessages(conversationId, requesterId, page = 1, limit = 50) {
    const conv = await Conversation.findOne({ id: conversationId });
    if (!conv) throw new Error("Conversation not found");

    // Requester must be participant
    if (conv.institute_id !== requesterId && conv.admin_id !== requesterId) {
      throw new Error("Access denied");
    }

    const skip = (page - 1) * limit;
    const messages = await ChatMessage.find({ conversation_id: conversationId })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ChatMessage.countDocuments({ conversation_id: conversationId });

    // Mark messages as read (messages sent by the other party)
    await ChatMessage.updateMany(
      { conversation_id: conversationId, sender_id: { $ne: requesterId }, is_read: false },
      { is_read: true }
    );

    return { messages, total, page, limit };
  }

  // ── Send a message ────────────────────────────────────────────
  async sendMessage(conversationId, senderId, { message_text, file_url, file_type, file_name }) {
    const conv = await Conversation.findOne({ id: conversationId });
    if (!conv) throw new Error("Conversation not found");

    if (conv.institute_id !== senderId && conv.admin_id !== senderId) {
      throw new Error("Access denied");
    }

    if (!message_text && !file_url) {
      throw new Error("Message must contain text or a file");
    }

    const id = await this.nextId("chatMessageId");
    const msg = await ChatMessage.create({
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      message_text: message_text || null,
      file_url: file_url || null,
      file_type: file_type || null,
      file_name: file_name || null,
    });

    // Update conversation preview
    await Conversation.findOneAndUpdate(
      { id: conversationId },
      {
        last_message: message_text || `📎 ${file_name || "File"}`,
        last_message_at: new Date(),
        updated_at: new Date(),
      }
    );

    return msg;
  }

  // ── Mark messages as read ─────────────────────────────────────
  async markAsRead(conversationId, readerId) {
    const conv = await Conversation.findOne({ id: conversationId });
    if (!conv) throw new Error("Conversation not found");
    if (conv.institute_id !== readerId && conv.admin_id !== readerId) {
      throw new Error("Access denied");
    }
    await ChatMessage.updateMany(
      { conversation_id: conversationId, sender_id: { $ne: readerId }, is_read: false },
      { is_read: true }
    );
  }

  // ── Unread count for a user ───────────────────────────────────
  async getUnreadCount(userId) {
    const convs = await Conversation.find({
      $or: [{ institute_id: userId }, { admin_id: userId }],
    }).lean();

    let total = 0;
    for (const c of convs) {
      const count = await ChatMessage.countDocuments({
        conversation_id: c.id,
        sender_id: { $ne: userId },
        is_read: false,
      });
      total += count;
    }
    return total;
  }
}

module.exports = new ChatService();
