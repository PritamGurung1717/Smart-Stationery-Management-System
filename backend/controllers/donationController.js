// backend/controllers/donationController.js
const donationService = require("../services/donationService");
const NotificationService = require("../services/notificationService");

class DonationController {
  // Create donation
  async createDonation(req, res) {
    try {
      const userId = req.user.id;
      const donationData = req.body;

      console.log("📝 Creating donation for user:", userId);

      const donation = await donationService.createDonation(userId, donationData);

      console.log("✅ Donation created successfully:", donation.id);

      res.status(201).json({
        success: true,
        message: "Donation created successfully",
        donation,
      });
    } catch (error) {
      console.error("❌ Create donation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create donation",
        error: error.message,
      });
    }
  }

  // Get all donations
  async getDonations(req, res) {
    try {
      const { status, category, condition, search, page = 1, limit = 20 } = req.query;

      const filters = {
        status,
        category,
        condition,
        search,
      };

      const result = await donationService.getDonations(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get donations error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch donations",
        error: error.message,
      });
    }
  }

  // Get single donation
  async getDonation(req, res) {
    try {
      const donationId = req.params.id;

      const donation = await donationService.getDonationById(donationId);

      res.json({
        success: true,
        donation,
      });
    } catch (error) {
      console.error("❌ Get donation error:", error);
      const statusCode = error.message === "Donation not found" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update donation
  async updateDonation(req, res) {
    try {
      const donationId = req.params.id;
      const userId = req.user.id;
      const updateData = req.body;

      console.log("📝 Updating donation:", donationId, "by user:", userId);

      const donation = await donationService.updateDonation(
        donationId,
        userId,
        updateData
      );

      console.log("✅ Donation updated successfully");

      res.json({
        success: true,
        message: "Donation updated successfully",
        donation,
      });
    } catch (error) {
      console.error("❌ Update donation error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete donation
  async deleteDonation(req, res) {
    try {
      const donationId = req.params.id;
      const userId = req.user.id;

      console.log("🗑️ Deleting donation:", donationId, "by user:", userId);

      const result = await donationService.deleteDonation(donationId, userId);

      console.log("✅ Donation deleted successfully");

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Delete donation error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Create donation request
  async createDonationRequest(req, res) {
    try {
      const donationId = req.params.id;
      const requesterId = req.user.id;
      const { message } = req.body;

      console.log("📝 Creating donation request for donation:", donationId);

      const request = await donationService.createDonationRequest(
        donationId,
        requesterId,
        message
      );

      console.log("✅ Donation request created successfully:", request.id);

      // Get donation details for notification
      try {
        const donation = await donationService.getDonationById(donationId);
        
        await NotificationService.createDonationRequestNotification(
          donation.donor_id,
          donationId,
          donation.title,
          req.user.name || `User #${requesterId}`
        );
        console.log("📬 Notification sent to donor");
      } catch (notifError) {
        console.error("⚠️ Failed to create notification:", notifError.message);
        // Don't fail the request if notification fails
      }

      res.status(201).json({
        success: true,
        message: "Donation request sent successfully",
        request,
      });
    } catch (error) {
      console.error("❌ Create donation request error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("cannot request") ||
            error.message.includes("already requested")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get donation requests
  async getDonationRequests(req, res) {
    try {
      const donationId = req.params.id;
      const userId = req.user.id;

      const requests = await donationService.getDonationRequests(donationId, userId);

      res.json({
        success: true,
        count: requests.length,
        requests,
      });
    } catch (error) {
      console.error("❌ Get donation requests error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Accept donation request
  async acceptDonationRequest(req, res) {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;

      console.log("✅ Accepting donation request:", requestId);

      const result = await donationService.acceptDonationRequest(requestId, userId);

      console.log("✅ Donation request accepted successfully");

      // Create notification for requester
      try {
        await NotificationService.createDonationResponseNotification(
          result.request.requester_id,
          result.donation.id,
          result.donation.title,
          'accepted'
        );
        console.log("📬 Notification sent to requester");
      } catch (notifError) {
        console.error("⚠️ Failed to create notification:", notifError.message);
        // Don't fail the request if notification fails
      }

      res.json({
        success: true,
        message: "Donation request accepted. You can now chat with the requester.",
        request: result.request,
        donation: result.donation,
      });
    } catch (error) {
      console.error("❌ Accept donation request error:", error);
      const statusCode =
        error.message.includes("not found")
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Reject donation request
  async rejectDonationRequest(req, res) {
    try {
      const requestId = req.params.id;
      const userId = req.user.id;

      console.log("❌ Rejecting donation request:", requestId);

      const request = await donationService.rejectDonationRequest(requestId, userId);

      console.log("✅ Donation request rejected successfully");

      // Create notification for requester
      try {
        await NotificationService.createDonationResponseNotification(
          request.requester_id,
          request.donation_id,
          request.donation_title,
          'rejected'
        );
        console.log("📬 Notification sent to requester");
      } catch (notifError) {
        console.error("⚠️ Failed to create notification:", notifError.message);
        // Don't fail the request if notification fails
      }

      res.json({
        success: true,
        message: "Donation request rejected",
        request,
      });
    } catch (error) {
      console.error("❌ Reject donation request error:", error);
      const statusCode =
        error.message.includes("not found")
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Mark donation as reserved
  async markAsReserved(req, res) {
    try {
      const donationId = req.params.id;
      const userId = req.user.id;

      console.log("📌 Marking donation as reserved:", donationId);

      const donation = await donationService.markAsReserved(donationId, userId);

      console.log("✅ Donation marked as reserved");

      res.json({
        success: true,
        message: "Donation marked as reserved",
        donation,
      });
    } catch (error) {
      console.error("❌ Mark as reserved error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Mark donation as completed
  async markAsCompleted(req, res) {
    try {
      const donationId = req.params.id;
      const userId = req.user.id;

      console.log("✅ Marking donation as completed:", donationId);

      const donation = await donationService.markAsCompleted(donationId, userId);

      console.log("✅ Donation marked as completed");

      res.json({
        success: true,
        message: "Donation marked as completed",
        donation,
      });
    } catch (error) {
      console.error("❌ Mark as completed error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get chat messages
  async getChatMessages(req, res) {
    try {
      const donationId = req.params.id;
      const userId = req.user.id;
      const { page = 1, limit = 50 } = req.query;

      const result = await donationService.getChatMessages(
        donationId,
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Get chat messages error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Send chat message
  async sendChatMessage(req, res) {
    try {
      const donationId = req.params.id;
      const senderId = req.user.id;
      const { message } = req.body;
      const attachmentUrl = req.body.attachment_url || null;

      console.log("💬 Sending chat message for donation:", donationId);

      const chatMessage = await donationService.sendChatMessage(
        donationId,
        senderId,
        message,
        attachmentUrl
      );

      console.log("✅ Chat message sent successfully");

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        chatMessage,
      });
    } catch (error) {
      console.error("❌ Send chat message error:", error);
      const statusCode =
        error.message === "Donation not found"
          ? 404
          : error.message.includes("not authorized")
          ? 403
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get user's donations
  async getUserDonations(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const donations = await donationService.getUserDonations(userId, status);

      res.json({
        success: true,
        count: donations.length,
        donations,
      });
    } catch (error) {
      console.error("❌ Get user donations error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user donations",
        error: error.message,
      });
    }
  }

  // Get user's donation requests
  async getUserRequests(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const requests = await donationService.getUserRequests(userId, status);

      res.json({
        success: true,
        count: requests.length,
        requests,
      });
    } catch (error) {
      console.error("❌ Get user requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user requests",
        error: error.message,
      });
    }
  }

  // Admin: Delete donation
  async adminDeleteDonation(req, res) {
    try {
      const donationId = req.params.id;
      const userId = req.user.id;

      console.log("🗑️ Admin deleting donation:", donationId);

      const result = await donationService.deleteDonation(donationId, userId, true);

      console.log("✅ Donation deleted by admin");

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Admin delete donation error:", error);
      const statusCode = error.message === "Donation not found" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Admin: Get all donations
  async adminGetDonations(req, res) {
    try {
      const { status, category, search, page = 1, limit = 20 } = req.query;

      const filters = {
        status,
        category,
        search,
      };

      const result = await donationService.getDonations(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("❌ Admin get donations error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch donations",
        error: error.message,
      });
    }
  }
}

module.exports = new DonationController();
