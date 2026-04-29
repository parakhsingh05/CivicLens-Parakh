const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP (free, no Google API needed)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,       // Your Gmail address (sender)
    pass: process.env.GMAIL_APP_PASS,   // Gmail App Password (not your normal Gmail password)
  },
});

/**
 * Sends a 6-digit OTP to the given email address.
 * Returns the OTP string so the caller can store it.
 */
const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"CivicLens" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your email – CivicLens',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #ea580c; margin-bottom: 8px;">CivicLens Email Verification</h2>
        <p style="color: #374151;">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #fff7ed; border: 2px dashed #ea580c; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #ea580c;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
