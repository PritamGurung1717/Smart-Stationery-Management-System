// backend/routes/donationRoutes.js
const express = require("express");
const router = express.Router();
const donationController = require("../controllers/donationController");
const { auth, adminAuth } = require("../middleware/auth");
const {
  validateDonationCreate,
  validateDonationUpdate,
  validateDonationRequest,
  validateChatMessage,
} = require("../middleware/donationValidation");
const {
  handleDonationImageUpload,
  handleChatAttachmentUpload,
} = require("../utils/fileUpload");

// ==================== PUBLIC ROUTES (Authenticated Users) ====================

// Get all donations (with filters) — no auth required for browsing
router.get("/", donationController.getDonations);

// Get single donation — no auth required for browsing
router.get("/:id", donationController.getDonation);

// Create donation (with image upload)
router.post(
  "/",
  auth,
  handleDonationImageUpload,
  validateDonationCreate,
  donationController.createDonation
);

// Update donation (with optional image upload)
router.put(
  "/:id",
  auth,
  handleDonationImageUpload,
  validateDonationUpdate,
  donationController.updateDonation
);

// Delete donation
router.delete("/:id", auth, donationController.deleteDonation);

// ==================== DONATION REQUEST ROUTES ====================

// Create donation request
router.post(
  "/:id/request",
  auth,
  validateDonationRequest,
  donationController.createDonationRequest
);

// Get donation requests (donor only)
router.get("/:id/requests", auth, donationController.getDonationRequests);

// Accept donation request
router.put(
  "/requests/:id/accept",
  auth,
  donationController.acceptDonationRequest
);

// Reject donation request
router.put(
  "/requests/:id/reject",
  auth,
  donationController.rejectDonationRequest
);

// ==================== STATUS UPDATE ROUTES ====================

// Mark donation as reserved
router.put("/:id/mark-reserved", auth, donationController.markAsReserved);

// Mark donation as completed
router.put("/:id/mark-completed", auth, donationController.markAsCompleted);

// ==================== CHAT ROUTES ====================

// Get chat messages
router.get("/:id/chat", auth, donationController.getChatMessages);

// Send chat message (with optional attachment)
router.post(
  "/:id/chat",
  auth,
  handleChatAttachmentUpload,
  validateChatMessage,
  donationController.sendChatMessage
);

// ==================== USER ROUTES ====================

// Get user's donations
router.get("/user/donations", auth, donationController.getUserDonations);

// Get user's donation requests
router.get("/user/requests", auth, donationController.getUserRequests);

// ==================== ADMIN ROUTES ====================

// Get all donations (admin view)
router.get("/admin/all", adminAuth, donationController.adminGetDonations);

// Delete donation (admin)
router.delete("/admin/:id", adminAuth, donationController.adminDeleteDonation);

module.exports = router;
