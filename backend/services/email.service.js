const https = require('https');

const sendOtpEmail = async (toEmail, otp) => {
  const data = JSON.stringify({
    from: { email: 'no-reply@test-3m5jgro5vexgdpyo.mlsender.net', name: 'CivicLens' },
    to: [{ email: toEmail }],
    subject: 'Verify your email – CivicLens',
    html: `<div style="font-family:Arial;padding:32px;"><h2 style="color:#ea580c;">CivicLens Email Verification</h2><p>Your verification code:</p><div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#ea580c;">${otp}</div><p>Expires in 10 minutes.</p></div>`,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.mailersend.com',
      path: '/v1/email',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

module.exports = { sendOtpEmail };