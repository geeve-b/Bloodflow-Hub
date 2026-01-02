import nodemailer from "nodemailer";

// Log SMTP config on startup (masking password)
console.log("[DEBUG] SMTP Config:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  from: process.env.SMTP_FROM_EMAIL,
  hasPassword: !!process.env.SMTP_PASS
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates for testing
  },
});

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendVerificationEmail(params: {
  email: string;
  name?: string;
  code: string;
}): Promise<void> {
  const { email, name, code } = params;
  const displayName = name || "there";
  const supportEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "bloodflowhub@gmail.com";
  const fromName = process.env.SMTP_FROM_NAME || "LifeFlow";

  // Log the code for debugging/development purposes
  console.log(`[DEBUG] Verification code for ${email}: ${code}`);
  console.log(`[DEBUG] Sending email from: "${fromName}" <${supportEmail}>`);

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
      to: email,
      subject: "Verify your LifeFlow account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; margin-bottom: 16px;">Verify Your Email Address</h2>
          <p style="font-size: 16px; color: #1f2937;">Hi ${displayName},</p>
          <p style="font-size: 16px; color: #1f2937;">Thanks for registering with LifeFlow. Please use the verification code below to complete your registration.</p>
          <div style="background-color: #fef2f2; padding: 24px; border-radius: 12px; border: 1px solid #fecaca; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #b91c1c;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #4b5563;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
          <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Stay safe,<br/>LifeFlow Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to send verification email to ${email}:`, error);
    // We don't throw here so the flow can continue in dev mode if email fails
    // The code is already logged above
  }
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name?: string;
  code: string;
}): Promise<void> {
  const { email, name, code } = params;
  const displayName = name || "there";
  const supportEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "bloodflowhub@gmail.com";
  const fromName = process.env.SMTP_FROM_NAME || "LifeFlow";

  // Log the code for debugging/development purposes
  console.log(`[DEBUG] Password reset code for ${email}: ${code}`);
  console.log(`[DEBUG] Sending email from: "${fromName}" <${supportEmail}>`);

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
      to: email,
      subject: "Reset your LifeFlow password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; margin-bottom: 16px;">Reset Your Password</h2>
          <p style="font-size: 16px; color: #1f2937;">Hi ${displayName},</p>
          <p style="font-size: 16px; color: #1f2937;">You requested to reset your password. Please use the code below to proceed.</p>
          <div style="background-color: #fef2f2; padding: 24px; border-radius: 12px; border: 1px solid #fecaca; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #b91c1c;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #4b5563;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
          <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Stay safe,<br/>LifeFlow Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error(`[ERROR] Failed to send password reset email to ${email}:`, error);
    // We don't throw here so the flow can continue in dev mode if email fails
    // The code is already logged above
  }
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  const { name, email, subject, message } = data;

  // Email to admin
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: process.env.SMTP_FROM_EMAIL,
    replyTo: email,
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">New Contact Form Submission</h2>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <h3>Message:</h3>
        <div style="background-color: #f9fafb; padding: 16px; border-left: 4px solid #dc2626; border-radius: 4px;">
          <p style="white-space: pre-wrap; word-wrap: break-word;">${message}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">
          This is an automated message from LifeFlow Contact Form. Please reply to the sender's email address.
        </p>
      </div>
    `,
  });

  // Confirmation email to user
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: `We received your message - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Thank You for Reaching Out</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and appreciate you taking the time to contact LifeFlow. Our team will review your inquiry and get back to you within 24-48 hours.</p>
        
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin-top: 0;">Your Message Details:</h3>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <h3>Next Steps:</h3>
        <ul>
          <li>We'll carefully review your message</li>
          <li>Our team will respond to your inquiry shortly</li>
          <li>If urgent, please contact us directly or call emergency services</li>
        </ul>

        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #dc2626;">
          <strong style="color: #991b1b;">⚠️ Important:</strong>
          <p style="margin: 8px 0 0 0;">If this is a medical emergency, please immediately contact emergency services (911 in the US or your local emergency number).</p>
        </div>

        <p>Best regards,<br/>
        <strong>LifeFlow Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">
          LifeFlow - Saving Lives, One Drop at a Time<br/>
          Email: bloodflowhub@gmail.com
        </p>
      </div>
    `,
  });
}
