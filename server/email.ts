import nodemailer from "nodemailer";

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
