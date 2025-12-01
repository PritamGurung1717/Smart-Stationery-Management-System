const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Simple sendEmail helper that returns a promise
const sendEmail = (to, subject, html) => {
  const mailOptions = {
    from: `"Smart Stationery Management System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };
  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
