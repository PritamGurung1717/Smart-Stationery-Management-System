// backend/services/khaltiService.js
const axios = require("axios");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_VERIFY_URL = "https://khalti.com/api/v2/payment/verify/";

/**
 * Verify a Khalti payment token with the Khalti server.
 * @param {string} token  - The token returned by Khalti checkout
 * @param {number} amount - Amount in paisa (NPR × 100)
 * @returns {Promise<object>} Khalti verification response
 */
const verifyKhaltiPayment = async (token, amount) => {
  if (!KHALTI_SECRET_KEY) {
    throw new Error("KHALTI_SECRET_KEY is not configured in environment variables.");
  }

  const response = await axios.post(
    KHALTI_VERIFY_URL,
    { token, amount },
    {
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 second timeout
    }
  );

  return response.data;
};

module.exports = { verifyKhaltiPayment };
