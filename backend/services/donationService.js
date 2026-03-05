// backend/services/donationService.js
const Donation = require("../models/donation");
const DonationRequest = require("../models/donationRequest");
const DonationChat = require("../models/donationChat");
const Counter = require("../models/counter");
const User = require("../models/user");
const { deleteFiles } = require("../utils/fileUpload");

class DonationService {
  // Get next donation ID
  async getNextDonationId() {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "donationId" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return counter.sequence_value;
  }

  // Get next donation request ID
  async getNextDonationRequestId() {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "donationRequestId" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return counter.sequence_value;
  }

  // Get next donation chat ID
  async getNextDonationChatId() {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "donationChatId" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return counter.sequence_value;
  }

  // Create donation
  async createDonation(donorId, donationData) {
    const id = await this.getNextDonationId();

    const donation = new Donation({
      id,
      donor_id: donorId,
      title: donationData.title.trim(),
      description: donationData.description.trim(),
      category: donationData.category.toLowerCase(),
      condition: donationData.condition.toLowerCase(),
      images: donationData.images,
      pickup_location: donationData.pickup_location.trim(),
      status: "available",
    });

    await donation.save();
    return donation;
  }

  // Get all donations with filters
  async getDonations(filters = {}, page = 1, limit = 20) {
    const query = {};

    // Status filter
    if (filters.status) {
      query.status = filters.status;
    } else {
      // By default, show available and reserved donations
      query.status = { $in: ["available", "reserved"] };
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      query.category = filters.category.toLowerCase();
    }

    // Condition filter
    if (filters.condition && filters.condition !== "all") {
      query.condition = filters.condition.toLowerCase();
    }

    // Donor filter
    if (filters.donor_id) {
      query.donor_id = filters.donor_id;
    }

    // Search filter
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const skip = (page - 1) * limit;

    const donations = await Donation.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Donation.countDocuments(query);

    // Populate donor information
    const donorIds = [...new Set(donations.map((d) => d.donor_id))];
    const donors = await User.find({ id: { $in: donorIds } }).select(
      "id name email role"
    );
    const donorMap = {};
    donors.forEach((donor) => {
      donorMap[donor.id] = {
        id: donor.id,
        name: donor.name,
        email: donor.email,
        role: donor.role,
      };
    });

    // Add donor info to donations
    const donationsWithDonor = donations.map((donation) => ({
      ...donation,
      donor: donorMap[donation.donor_id] || null,
    }));

    return {
      donations: donationsWithDonor,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get single donation by ID
  async getDonationById(donationId) {
    const donation = await Donation.findById(donationId).lean();

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Get donor information
    const donor = await User.findOne({ id: donation.donor_id }).select(
      "id name email role phone"
    );

    // Get accepted requester information if exists
    let acceptedRequester = null;
    if (donation.accepted_requester_id) {
      acceptedRequester = await User.findOne({
        id: donation.accepted_requester_id,
      }).select("id name email role phone");
    }

    return {
      ...donation,
      donor: donor
        ? {
            id: donor.id,
            name: donor.name,
            email: donor.email,
            role: donor.role,
            phone: donor.phone,
          }
        : null,
      accepted_requester: acceptedRequester
        ? {
            id: acceptedRequester.id,
            name: acceptedRequester.name,
            email: acceptedRequester.email,
            role: acceptedRequester.role,
            phone: acceptedRequester.phone,
          }
        : null,
    };
  }

  // Update donation
  async updateDonation(donationId, userId, updateData) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check ownership
    if (donation.donor_id !== userId) {
      throw new Error("You are not authorized to update this donation");
    }

    // Check if donation can be edited
    if (!donation.canEdit()) {
      throw new Error("Cannot edit donation that is not available");
    }

    // Update fields
    if (updateData.title) donation.title = updateData.title.trim();
    if (updateData.description)
      donation.description = updateData.description.trim();
    if (updateData.category)
      donation.category = updateData.category.toLowerCase();
    if (updateData.condition)
      donation.condition = updateData.condition.toLowerCase();
    if (updateData.images) donation.images = updateData.images;
    if (updateData.pickup_location)
      donation.pickup_location = updateData.pickup_location.trim();

    await donation.save();
    return donation;
  }

  // Delete donation
  async deleteDonation(donationId, userId, isAdmin = false) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check ownership (unless admin)
    if (!isAdmin && donation.donor_id !== userId) {
      throw new Error("You are not authorized to delete this donation");
    }

    // Delete associated images
    deleteFiles(donation.images);

    // Delete associated requests
    await DonationRequest.deleteMany({ donation_id: donationId });

    // Delete associated chats
    await DonationChat.deleteMany({ donation_id: donationId });

    // Delete donation
    await Donation.deleteOne({ id: donationId });

    return { message: "Donation deleted successfully" };
  }

  // Create donation request
  async createDonationRequest(donationId, requesterId, message) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check if donation can be requested
    if (!donation.canRequest(requesterId)) {
      if (donation.donor_id === requesterId) {
        throw new Error("You cannot request your own donation");
      }
      throw new Error("This donation is not available for requests");
    }

    // Check if user already requested
    const existingRequest = await DonationRequest.findOne({
      donation_id: donationId,
      requester_id: requesterId,
    });

    if (existingRequest) {
      throw new Error("You have already requested this donation");
    }

    const id = await this.getNextDonationRequestId();

    const request = new DonationRequest({
      id,
      donation_id: donationId,
      requester_id: requesterId,
      message: message.trim(),
      status: "pending",
    });

    await request.save();
    return request;
  }

  // Get donation requests
  async getDonationRequests(donationId, userId) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Only donor can view requests
    if (donation.donor_id !== userId) {
      throw new Error("You are not authorized to view these requests");
    }

    const requests = await DonationRequest.find({ donation_id: donationId })
      .sort({ created_at: -1 })
      .lean();

    // Populate requester information
    const requesterIds = [...new Set(requests.map((r) => r.requester_id))];
    const requesters = await User.find({ id: { $in: requesterIds } }).select(
      "id name email role phone"
    );
    const requesterMap = {};
    requesters.forEach((requester) => {
      requesterMap[requester.id] = {
        id: requester.id,
        name: requester.name,
        email: requester.email,
        role: requester.role,
        phone: requester.phone,
      };
    });

    // Add requester info to requests
    const requestsWithRequester = requests.map((request) => ({
      ...request,
      requester: requesterMap[request.requester_id] || null,
    }));

    return requestsWithRequester;
  }

  // Accept donation request
  async acceptDonationRequest(requestId, userId) {
    const request = await DonationRequest.findById(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    const donation = await Donation.findById(request.donation_id);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check ownership
    if (donation.donor_id !== userId) {
      throw new Error("You are not authorized to accept this request");
    }

    // Check if request can be accepted
    if (!request.canAccept()) {
      throw new Error("This request cannot be accepted");
    }

    // Check if donation is still available
    if (donation.status !== "available") {
      throw new Error("This donation is no longer available");
    }

    // Accept the request
    request.status = "accepted";
    await request.save();

    // Update donation status to reserved
    donation.status = "reserved";
    donation.accepted_requester_id = request.requester_id;
    await donation.save();

    // Reject all other pending requests
    await DonationRequest.updateMany(
      {
        donation_id: request.donation_id,
        id: { $ne: requestId },
        status: "pending",
      },
      {
        $set: { status: "rejected" },
      }
    );

    return { request, donation };
  }

  // Reject donation request
  async rejectDonationRequest(requestId, userId) {
    const request = await DonationRequest.findById(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    const donation = await Donation.findById(request.donation_id);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check ownership
    if (donation.donor_id !== userId) {
      throw new Error("You are not authorized to reject this request");
    }

    // Check if request can be rejected
    if (!request.canReject()) {
      throw new Error("This request cannot be rejected");
    }

    // Reject the request
    request.status = "rejected";
    await request.save();

    return request;
  }

  // Mark donation as reserved (manual)
  async markAsReserved(donationId, userId) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check ownership
    if (donation.donor_id !== userId) {
      throw new Error("You are not authorized to update this donation");
    }

    if (donation.status !== "available") {
      throw new Error("Donation is not available");
    }

    donation.status = "reserved";
    await donation.save();

    return donation;
  }

  // Mark donation as completed
  async markAsCompleted(donationId, userId) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check ownership
    if (donation.donor_id !== userId) {
      throw new Error("You are not authorized to update this donation");
    }

    if (donation.status !== "reserved") {
      throw new Error("Only reserved donations can be marked as completed");
    }

    donation.status = "completed";
    await donation.save();

    return donation;
  }

  // Get chat messages
  async getChatMessages(donationId, userId, page = 1, limit = 50) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check if user can chat
    if (!donation.canChat(userId)) {
      throw new Error("You are not authorized to view this chat");
    }

    const skip = (page - 1) * limit;

    const messages = await DonationChat.find({ donation_id: donationId })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await DonationChat.countDocuments({ donation_id: donationId });

    // Mark messages as read for the current user
    await DonationChat.markAllAsRead(donationId, userId);

    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Send chat message
  async sendChatMessage(donationId, senderId, message, attachmentUrl = null) {
    const donation = await Donation.findById(donationId);

    if (!donation) {
      throw new Error("Donation not found");
    }

    // Check if user can chat
    if (!donation.canChat(senderId)) {
      throw new Error("You are not authorized to send messages in this chat");
    }

    // Determine receiver
    const receiverId =
      donation.donor_id === senderId
        ? donation.accepted_requester_id
        : donation.donor_id;

    const id = await this.getNextDonationChatId();

    const chatMessage = new DonationChat({
      id,
      donation_id: donationId,
      sender_id: senderId,
      receiver_id: receiverId,
      message: message.trim(),
      attachment_url: attachmentUrl,
      is_read: false,
    });

    await chatMessage.save();
    return chatMessage;
  }

  // Get user's donations
  async getUserDonations(userId, status = null) {
    const query = { donor_id: userId };
    if (status) {
      query.status = status;
    }

    const donations = await Donation.find(query)
      .sort({ created_at: -1 })
      .lean();

    return donations;
  }

  // Get user's donation requests
  async getUserRequests(userId, status = null) {
    const query = { requester_id: userId };
    if (status) {
      query.status = status;
    }

    const requests = await DonationRequest.find(query)
      .sort({ created_at: -1 })
      .lean();

    // Populate donation information
    const donationIds = [...new Set(requests.map((r) => r.donation_id))];
    const donations = await Donation.find({ id: { $in: donationIds } }).lean();
    const donationMap = {};
    donations.forEach((donation) => {
      donationMap[donation.id] = donation;
    });

    // Add donation info to requests
    const requestsWithDonation = requests.map((request) => ({
      ...request,
      donation: donationMap[request.donation_id] || null,
    }));

    return requestsWithDonation;
  }
}

module.exports = new DonationService();
