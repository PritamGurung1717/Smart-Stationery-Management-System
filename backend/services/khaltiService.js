// backend/services/khaltiService.js
const axios = require("axios");

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
const KHALTI_INITIATE_URL = "https://a.khalti.com/api/v2/epayment/initiate/";
const KHALTI_LOOKUP_URL = "https://a.khalti.com/api/v2/epayment/lookup/";

/**
 * Initiate a Khalti ePay payment session.
 * @param {object} paymentData - { return_url, website_url, amount, purchase_order_id, purchase_order_name, customer_info }
 * @returns {Promise<object>} Khalti initiate response with payment_url and pidx
 */
const initiateKhaltiPayment = async (paymentData) => {
  if (!KHALTI_SECRET_KEY) {
    throw new Error("KHALTI_SECRET_KEY is not configured in environment variables.");
  }

  const response = await axios.post(KHALTI_INITIATE_URL, paymentData, {
    headers: {
      Authorization: `Key ${KHALTI_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  return response.data;
};

/**
 * Lookup/verify a Khalti payment using pidx.
 * @param {string} pidx - Payment index returned by Khalti after user completes payment
 * @returns {Promise<object>} Khalti lookup response with transaction details
 */
const lookupKhaltiPayment = async (pidx) => {
  if (!KHALTI_SECRET_KEY) {
    throw new Error("KHALTI_SECRET_KEY is not configured in environment variables.");
  }

  const response = await axios.post(
    KHALTI_LOOKUP_URL,
    { pidx },
    {
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  return response.data;
};

module.exports = { initiateKhaltiPayment, lookupKhaltiPayment };
