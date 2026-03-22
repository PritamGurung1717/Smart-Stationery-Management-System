// backend/services/requestService.js
const ItemRequest = require('../models/itemRequest');
const User = require('../models/user');

class RequestService {
  // Create a new item request
  async createRequest(userId, data) {
    const { item_name, category, description, quantity_requested } = data;

    const request = new ItemRequest({
      user_id: userId,
      item_name: item_name.trim(),
      category,
      description: description?.trim() || '',
      quantity_requested: parseInt(quantity_requested),
      status: 'pending'
    });

    await request.save();
    return request.toObject();
  }

  // Get requests for a specific user
  async getUserRequests(userId, status = null) {
    const query = { user_id: userId };
    if (status) query.status = status;

    const requests = await ItemRequest.find(query)
      .sort({ created_at: -1 })
      .lean();

    return requests;
  }

  // Cancel a request (user only, only if pending)
  async cancelRequest(requestId, userId) {
    const request = await ItemRequest.findOne({ id: parseInt(requestId) });

    if (!request) throw new Error('Request not found');
    if (request.user_id !== userId) throw new Error('Not authorized');
    if (request.status !== 'pending') {
      throw new Error(`Cannot cancel a request with status: ${request.status}`);
    }

    request.status = 'cancelled';
    request.updated_at = new Date();
    await request.save();
    return request.toObject();
  }

  // Admin: Get all requests with user info
  async getAllRequests(filters = {}, page = 1, limit = 20) {
    const query = {};
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    if (filters.search) {
      query.item_name = { $regex: filters.search, $options: 'i' };
    }
    if (filters.category && filters.category !== 'all') query.category = filters.category;

    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      ItemRequest.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      ItemRequest.countDocuments(query)
    ]);

    // Attach user info
    const userIds = [...new Set(requests.map(r => r.user_id))];
    const users = await User.find({ id: { $in: userIds } }).select('id name email role').lean();
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const enriched = requests.map(r => ({
      ...r,
      user: userMap[r.user_id] || null
    }));

    return {
      requests: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Admin: Get single request
  async getRequestById(requestId) {
    const request = await ItemRequest.findOne({ id: parseInt(requestId) }).lean();
    if (!request) throw new Error('Request not found');

    const user = await User.findOne({ id: request.user_id }).select('id name email role').lean();
    return { ...request, user };
  }

  // Admin: Approve request
  async approveRequest(requestId) {
    const request = await ItemRequest.findOne({ id: parseInt(requestId) });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    request.status = 'approved';
    request.updated_at = new Date();
    await request.save();
    return request.toObject();
  }

  // Admin: Reject request
  async rejectRequest(requestId, admin_remark) {
    const request = await ItemRequest.findOne({ id: parseInt(requestId) });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    request.status = 'rejected';
    request.admin_remark = admin_remark?.trim() || 'Request rejected by admin';
    request.updated_at = new Date();
    await request.save();
    return request.toObject();
  }
}

module.exports = new RequestService();
