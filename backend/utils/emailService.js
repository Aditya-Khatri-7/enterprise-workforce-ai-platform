const nodemailer = require('nodemailer');
const https = require('https');

// Singleton transporter configured from environment variables (used for local/SMTP fallback)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Universal email sender wrapper supporting Resend HTTP API (production/Render)
 * and falling back to Nodemailer SMTP (local development).
 */
const sendMailWrapper = async (options) => {
  if (process.env.BREVO_API_KEY) {
    console.log(`Sending email to ${options.to} via Brevo HTTP API...`);
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'skdubey568@gmail.com';
    const senderName = 'Workforce Portal';

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        sender: { name: senderName, email: senderEmail.trim() },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
      });

      const reqOptions = {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Brevo API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(postData);
      req.end();
    });
  } else {
    console.log(`Sending email to ${options.to} via Nodemailer SMTP...`);
    const mailOptions = {
      from: `"Workforce Portal" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    return transporter.sendMail(mailOptions);
  }
};

/**
 * Sends a welcome email to a newly created employee with their login credentials.
 */
const sendWelcomeEmail = async ({ to, firstName, email, temporaryPassword }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a56db; text-align: center;">Welcome to the Workforce Portal!</h2>
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your employee account has been successfully created. Below are your login credentials:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <span style="font-size: 1.1em; letter-spacing: 2px; color: #1f2937;">${temporaryPassword}</span></p>
      </div>
      <p style="color: #ef4444;"><strong>Important:</strong> You will be prompted to change your password on your first login. Please keep this information secure.</p>
      <p>If you have any issues, please contact your HR administrator.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 0.8em; text-align: center;">This is an automated message from the Workforce Portal. Please do not reply.</p>
    </div>
  `;

  await sendMailWrapper({
    to,
    subject: 'Welcome to Workforce Portal - Your Login Credentials',
    html: htmlContent,
  });
};

/**
 * Sends an OTP email for password recovery.
 */
const sendOtpEmail = async ({ to, otpCode }) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a56db; text-align: center;">Password Reset Request</h2>
      <p>You have requested to reset your password for the Workforce Portal.</p>
      <p>Please use the following OTP to reset your password. This OTP is valid for <strong>5 minutes</strong>.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <h1 style="letter-spacing: 8px; color: #1f2937; margin: 0; font-size: 2.5em;">${otpCode}</h1>
      </div>
      <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 0.8em; text-align: center;">This is an automated message from the Workforce Portal. Please do not reply.</p>
    </div>
  `;

  await sendMailWrapper({
    to,
    subject: 'Password Reset OTP - Workforce Portal',
    html: htmlContent,
  });
};

module.exports = { sendWelcomeEmail, sendOtpEmail };
