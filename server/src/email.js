import nodemailer from 'nodemailer';

/**
 * CiteCheck AI — Email Verification Service
 * Handles user email verification links using Nodemailer and environment variables.
 */

function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || !host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 4000, // 4 seconds connection timeout
    greetingTimeout: 3000,   // 3 seconds greeting timeout
    socketTimeout: 5000,     // 5 seconds socket timeout
  });
}

export async function sendVerificationEmail({ to, name, verificationToken, baseUrl = null }) {
  const defaultAppUrl = process.env.APP_URL || baseUrl || 'http://localhost:5173';
  const appUrl = defaultAppUrl.replace(/\/$/, '');
  const verificationUrl = `${appUrl}/?verify_token=${verificationToken}`;
  const fromAddress = process.env.EMAIL_FROM || '"CiteCheck AI" <noreply@citecheck.ai>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your CiteCheck AI Academic Account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 24px; color: #142B4A; }
        .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #DCE3EB; box-shadow: 0 4px 16px rgba(20, 43, 74, 0.06); overflow: hidden; }
        .header { background: #0C2340; padding: 24px 32px; text-align: left; }
        .brand { color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0; }
        .brand-teal { color: #18B4C9; }
        .content { padding: 32px; }
        .greeting { font-size: 18px; font-weight: 600; color: #142B4A; margin-bottom: 16px; }
        .paragraph { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: #087E8B; color: #FFFFFF !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(8, 126, 139, 0.3); }
        .alt-link { font-size: 12px; color: #64748B; word-break: break-all; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; }
        .footer { font-size: 12px; color: #94A3B8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="brand">CiteCheck <span class="brand-teal">AI</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Welcome to CiteCheck AI, ${name || 'Colleague'}!</div>
          <p class="paragraph">
            Thank you for registering with CiteCheck AI, the academic citation verification platform powered by Google Gemini.
          </p>
          <p class="paragraph">
            To activate your academic workspace and start verifying research claims against source passages, please confirm your email address by clicking the button below:
          </p>
          <div class="btn-wrapper">
            <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener">Verify My Account</a>
          </div>
          <p class="paragraph" style="font-size: 13px; color: #64748B;">
            This verification link will remain valid for 24 hours. If you did not create a CiteCheck AI account, you can safely disregard this email.
          </p>
          <div class="alt-link">
            Or copy and paste this verification link into your browser:<br>
            <a href="${verificationUrl}" style="color: #087E8B;">${verificationUrl}</a>
          </div>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} CiteCheck AI. Rigorous Academic Evidence Verification.
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to CiteCheck AI, ${name || 'Colleague'}!

Please verify your academic account by visiting the following link:
${verificationUrl}

This link is valid for 24 hours.

If you did not register for an account, please ignore this email.
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n=============================================================');
    console.log('[CiteCheck AI Email Service] Notice: SMTP credentials not set in server/.env');
    console.log(`[CiteCheck AI Email Service] Recipient: ${to}`);
    console.log(`[CiteCheck AI Email Service] Verification Link: ${verificationUrl}`);
    console.log('=============================================================\n');
    return {
      sent: true,
      simulated: true,
      verificationUrl,
      message: 'SMTP credentials not configured. Verification link logged in console.'
    };
  }

  try {
    const timeoutPromise = new Promise((_, reject) => {
      const t = setTimeout(() => reject(new Error('SMTP connection timed out after 5 seconds.')), 5000);
      if (typeof t.unref === 'function') t.unref();
    });

    const info = await Promise.race([
      transporter.sendMail({
        from: fromAddress,
        to,
        subject: 'Verify your CiteCheck AI Academic Account',
        text: textContent,
        html: htmlContent,
      }),
      timeoutPromise
    ]);

    console.log(`[CiteCheck AI Email Service] Verification email delivered to ${to}. MessageId: ${info.messageId}`);
    return { sent: true, simulated: false, messageId: info.messageId, verificationUrl };
  } catch (err) {
    console.warn(`[CiteCheck AI Email Service] Email dispatch notice for ${to}:`, err.message);
    // Return verificationUrl so testing or deployment never gets blocked by network SMTP restrictions
    return {
      sent: false,
      error: err.message,
      verificationUrl,
      message: `Failed to deliver verification email via SMTP (${err.message}). Verification link generated.`
    };
  }
}
