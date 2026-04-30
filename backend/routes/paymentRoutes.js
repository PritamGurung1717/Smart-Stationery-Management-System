// backend/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { initiateKhaltiPaymentHandler, verifyKhaltiPaymentHandler } = require("../controllers/paymentController");

// POST /api/payment/khalti/initiate
router.post("/khalti/initiate", auth, initiateKhaltiPaymentHandler);

// POST /api/payment/khalti/verify
router.post("/khalti/verify", auth, verifyKhaltiPaymentHandler);

module.exports = router;
