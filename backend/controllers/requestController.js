// backend/controllers/requestController.js
const requestService = require('../services/requestService');
const NotificationService = require('../services/notificationService');

// POST /api/requests — user submits a request
exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_name, category, description, quantity_requested } = req.body;

    // Validation
    if (!item_name || item_name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Item name is required (min 3 characters)' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    const qty = parseInt(quantity_requested);
    if (!qty || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const request = await requestService.createRequest(userId, {
      item_name, category, description, quantity_requested: qty
    });

    // Notify admin
    try {
      const User = require('../models/user');
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        await NotificationService.createNotification({
          user_id: adminUser.id,
          type: 'donation_request_received',
          title: '📦 New Item Request',
          message: `User #${userId} requested: ${item_name} (${qty} units)`,
          link: '/admin-dashboard',
          icon: '📦'
        });
      }
    } catch (e) { /* non-blocking */ }

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      status: 'pending',
      request
    });
  } catch (err) {
    console.error('createRequest error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/requests/my — user views their own requests
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const requests = await requestService.getUserRequests(userId, status || null);
    res.json({ success: true, requests, count: requests.length });
  } catch (err) {
    console.error('getMyRequests error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/requests/:id/cancel — user cancels their pending request
exports.cancelRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const request = await requestService.cancelRequest(id, userId);
    res.json({ success: true, message: 'Request cancelled', request });
  } catch (err) {
    const status = err.message === 'Request not found' ? 404
      : err.message === 'Not authorized' ? 403 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};

// GET /api/admin/requests — admin views all requests
exports.adminGetRequests = async (req, res) => {
  try {
    const { status, search, category, page = 1, limit = 20 } = req.query;
    const result = await requestService.getAllRequests(
      { status, search, category },
      parseInt(page),
      parseInt(limit)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('adminGetRequests error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/requests/:id — admin views single request
exports.adminGetRequest = async (req, res) => {
  try {
    const request = await requestService.getRequestById(req.params.id);
    res.json({ success: true, request });
  } catch (err) {
    res.status(err.message === 'Request not found' ? 404 : 500)
      .json({ success: false, message: err.message });
  }
};

// PUT /api/admin/requests/:id/approve
exports.adminApproveRequest = async (req, res) => {
  try {
    const request = await requestService.approveRequest(req.params.id);

    // Notify user
    try {
      await NotificationService.createNotification({
        user_id: request.user_id,
        type: 'book_set_approved',
        title: '✅ Item Request Approved!',
        message: `Your request for "${request.item_name}" has been approved!`,
        link: '/my-item-requests',
        icon: '✅'
      });
    } catch (e) { /* non-blocking */ }

    res.json({ success: true, message: 'Request approved', request });
  } catch (err) {
    res.status(err.message === 'Request not found' ? 404 : 400)
      .json({ success: false, message: err.message });
  }
};

// PUT /api/admin/requests/:id/reject
exports.adminRejectRequest = async (req, res) => {
  try {
    const { admin_remark } = req.body;
    if (!admin_remark || admin_remark.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const request = await requestService.rejectRequest(req.params.id, admin_remark);

    // Notify user
    try {
      await NotificationService.createNotification({
        user_id: request.user_id,
        type: 'book_set_rejected',
        title: '❌ Item Request Rejected',
        message: `Your request for "${request.item_name}" was rejected. Reason: ${admin_remark}`,
        link: '/my-item-requests',
        icon: '❌'
      });
    } catch (e) { /* non-blocking */ }

    res.json({ success: true, message: 'Request rejected', request });
  } catch (err) {
    res.status(err.message === 'Request not found' ? 404 : 400)
      .json({ success: false, message: err.message });
  }
};
