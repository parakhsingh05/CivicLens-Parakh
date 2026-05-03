const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: '"CivicLens" <aa103b001@smtp-brevo.com>',
    to: toEmail,
    subject: 'Verify your email – CivicLens',
    html: `<div style="font-family:Arial;padding:32px;"><h2 style="color:#ea580c;">CivicLens Email Verification</h2><p>Your verification code:</p><div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#ea580c;">${otp}</div><p>Expires in 10 minutes.</p></div>`,
  });
};

module.exports = { sendOtpEmail };