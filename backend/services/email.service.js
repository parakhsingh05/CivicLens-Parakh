const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, otp) => {
  await resend.emails.send({
    from: 'CivicLens <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Verify your email - CivicLens',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #ea580c;">CivicLens Email Verification</h2>
        <p>Use the code below. Expires in <strong>10 minutes</strong>.</p>
        <div style="background: #fff7ed; border: 2px dashed #ea580c; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #ea580c;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };