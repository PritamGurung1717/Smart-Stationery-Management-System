// backend/routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const ctrl = require('../controllers/requestController');

// User routes
router.post('/', auth, ctrl.createRequest);
router.get('/my', auth, ctrl.getMyRequests);
router.put('/:id/cancel', auth, ctrl.cancelRequest);

// Admin routes
router.get('/admin/all', adminAuth, ctrl.adminGetRequests);
router.get('/admin/:id', adminAuth, ctrl.adminGetRequest);
router.put('/admin/:id/approve', adminAuth, ctrl.adminApproveRequest);
router.put('/admin/:id/reject', adminAuth, ctrl.adminRejectRequest);

module.exports = router;
