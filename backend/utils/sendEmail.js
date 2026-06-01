const { Resend } = require("resend");

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Simple sendEmail helper that returns a promise
const sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: "Smart Stationery <onboarding@resend.dev>", // Use your verified domain here later!
      to: [to],
      subject: subject,
      html: html,
    });
    console.log("✅ Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
