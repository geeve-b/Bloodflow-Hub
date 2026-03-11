import nodemailer from "nodemailer";
import crypto from "crypto";

const hasSmtpConfig =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

console.log("[DEBUG] SMTP Config:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  from: process.env.SMTP_FROM_EMAIL,
  hasPassword: !!process.env.SMTP_PASS,
  usingProvidedConfig: hasSmtpConfig,
});

let transporterPromise: Promise<nodemailer.Transporter> | null = null;
let usingTestAccount = false;
let testAccountEmail: string | undefined;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (hasSmtpConfig) {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_PORT === "465",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      }

      const account = await nodemailer.createTestAccount();
      usingTestAccount = true;
      testAccountEmail = account.user;
      console.warn(
        "[DEBUG] No SMTP credentials provided. Using Ethereal test account for email delivery:",
        { user: account.user },
      );
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });
    })();
  }
  return transporterPromise;
}

function logTestPreview(info: nodemailer.SentMessageInfo) {
  if (!usingTestAccount) {
    return;
  }
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("[DEBUG] Preview email at:", previewUrl);
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

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
  const supportEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    testAccountEmail ||
    "bloodflowhub@gmail.com";
  const fromName = process.env.SMTP_FROM_NAME || "LifeFlow";

  // Log the code for debugging/development purposes
  console.log(`[DEBUG] Verification code for ${email}: ${code}`);
  console.log(`[DEBUG] Sending email from: "${fromName}" <${supportEmail}>`);

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
      to: email,
      subject: "Verify your LifeFlow account",
      text: `Hi ${displayName},\n\nYour LifeFlow verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.\n\n— LifeFlow Team`,
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
    logTestPreview(info);
  } catch (error) {
    console.error(`[ERROR] Failed to send verification email to ${email}:`, error);
    throw error;
  }
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name?: string;
  code: string;
}): Promise<void> {
  const { email, name, code } = params;
  const displayName = name || "there";
  const supportEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    testAccountEmail ||
    "bloodflowhub@gmail.com";
  const fromName = process.env.SMTP_FROM_NAME || "LifeFlow";

  // Log the code for debugging/development purposes
  console.log(`[DEBUG] Password reset code for ${email}: ${code}`);
  console.log(`[DEBUG] Sending email from: "${fromName}" <${supportEmail}>`);

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
      to: email,
      subject: "Reset your LifeFlow password",
      text: `Hi ${displayName},\n\nUse this code to reset your LifeFlow password: ${code}\n\nThe code expires in 10 minutes. If you did not request a reset, please ignore this email.\n\n— LifeFlow Team`,
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
    logTestPreview(info);
  } catch (error) {
    console.error(`[ERROR] Failed to send password reset email to ${email}:`, error);
    throw error;
  }
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  const { name, email, subject, message } = data;
  const fromName = process.env.SMTP_FROM_NAME || "LifeFlow";
  const supportEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    testAccountEmail ||
    "bloodflowhub@gmail.com";
  const transporter = await getTransporter();

  try {
    const adminInfo = await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
      to: supportEmail,
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
    logTestPreview(adminInfo);

    const userInfo = await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
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
    logTestPreview(userInfo);
  } catch (error) {
    console.error("[ERROR] Failed to send contact emails:", error);
    throw error;
  }
}

export async function sendBloodRequestNotification(params: {
  donorEmail: string;
  donorName: string;
  bloodType: string;
  urgency: string;
  hospitalName: string;
  requesterName: string;
  country?: string;
  state?: string;
  district?: string;
  address?: string;
}): Promise<void> {
  const { donorEmail, donorName, bloodType, urgency, hospitalName, requesterName, country, state, district, address } = params;
  const fromName = process.env.SMTP_FROM_NAME || "LifeFlow";
  const supportEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    testAccountEmail ||
    "bloodflowhub@gmail.com";

  const appUrl = process.env.APP_URL || "http://localhost:5000";

  // IMPORTANT DEBUG: Verify email address is correct
  console.log(`[DEBUG] sendBloodRequestNotification called with donorEmail: "${donorEmail}", donorName: "${donorName}"`);
  
  // Allow any non-empty email address (including fallback formats)
  if (!donorEmail || donorEmail.trim() === "") {
    console.error(`[ERROR] CRITICAL: Empty donorEmail passed to sendBloodRequestNotification!`);
    throw new Error("donorEmail is empty");
  }
  
  // Log if using fallback email
  if (donorEmail.includes("@donor.bloodflow.local")) {
    console.warn(`[WARN] Using fallback email format for donor: ${donorEmail}`);
  }

  // Map urgency to color and display text
  const urgencyColors: Record<string, string> = {
    critical: "#dc2626",
    normal: "#2563eb",
  };

  const urgencyLabels: Record<string, string> = {
    critical: "🚨 CRITICAL",
    normal: "ℹ️ NORMAL",
  };

  const urgencyColor = urgencyColors[urgency] || urgencyColors.normal;
  const urgencyLabel = urgencyLabels[urgency] || urgencyLabels.normal;

  console.log(`[DEBUG] Sending blood request notification to ${donorEmail}`);

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
      to: donorEmail,
      subject: `${urgencyLabel} Blood Donation Request - ${bloodType}`,
      text: `Hi ${donorName},\n\nThere is a blood donation request that matches your blood type (${bloodType}).\n\nUrgency: ${urgency}\nHospital: ${hospitalName}\nRequester: ${requesterName}\n\nYour donation could save a life. Please log in to your dashboard to respond to this request.\n\nThank you for being a registered donor!\n\n— LifeFlow Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; margin-bottom: 16px;">🩸 Blood Donation Request</h2>
          <p style="font-size: 16px; color: #1f2937;">Hi ${donorName},</p>
          <p style="font-size: 16px; color: #1f2937;">There is an urgent blood donation request that matches your blood type. Your help could save a life!</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 12px; border: 2px solid ${urgencyColor}; margin: 24px 0;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 24px; font-weight: bold; color: ${urgencyColor};">${urgencyLabel}</span>
            </div>
            <div style="background-color: white; padding: 16px; border-radius: 8px;">
              <p style="margin: 8px 0;"><strong>Blood Type:</strong> <span style="font-size: 20px; color: #dc2626; font-weight: bold;">${bloodType}</span></p>
              <p style="margin: 8px 0;"><strong>Hospital:</strong> ${hospitalName}</p>
              <p style="margin: 8px 0;"><strong>Requester:</strong> ${requesterName}</p>
              <p style="margin: 8px 0;"><strong>Urgency Level:</strong> ${urgencyLabel.replace(/^[^A-Z]*\s?/, "")}</p>
              ${country ? `<p style="margin: 8px 0;"><strong>Country:</strong> ${country}</p>` : ""}
              ${state ? `<p style="margin: 8px 0;"><strong>State/Province:</strong> ${state}</p>` : ""}
              ${district ? `<p style="margin: 8px 0;"><strong>District/City:</strong> ${district}</p>` : ""}
              ${address ? `<p style="margin: 8px 0;"><strong>Address:</strong> ${address}</p>` : ""}
            </div>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${appUrl}/dashboard" style="background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              View Request & Respond
            </a>
          </div>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Why Your Donation Matters:</h3>
            <ul style="margin: 8px 0; padding-left: 20px; color: #4b5563;">
              <li>One donation can save up to three lives</li>
              <li>Blood cannot be manufactured - it can only come from donors</li>
              <li>Your blood type is specifically needed for this patient</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #6b7280;">If you're unable to donate at this time, you can update your availability in your donor dashboard.</p>
          
          <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Thank you for being a registered blood donor,<br/>
          <strong>LifeFlow Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            LifeFlow - Saving Lives, One Drop at a Time<br/>
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      `,
    });
    logTestPreview(info);
    console.log(`[DEBUG] Blood request notification sent successfully to ${donorEmail}`);
  } catch (error) {
    console.error(`[ERROR] Failed to send blood request notification to ${donorEmail}:`, error);
    throw error;
  }
}

export interface BloodExpiryAlertEmailParams {
  email: string;
  staffName: string;
  alertLevel: "critical" | "warning" | "info";
  bloodType: string;
  quantity: number;
  daysRemaining: number;
  expiryDate: Date;
  hospitalName: string;
}

export async function sendBloodExpiryAlertEmail(
  params: BloodExpiryAlertEmailParams
): Promise<void> {
  const {
    email,
    staffName,
    alertLevel,
    bloodType,
    quantity,
    daysRemaining,
    expiryDate,
    hospitalName,
  } = params;

  const fromName = process.env.SMTP_FROM_NAME || "LifeFlow";
  const supportEmail =
    process.env.SMTP_FROM_EMAIL ||
    process.env.SMTP_USER ||
    testAccountEmail ||
    "bloodflowhub@gmail.com";

  // Determine alert styling based on level
  let alertColor = "#dc2626";
  let alertBgColor = "#fef2f2";
  let alertBorderColor = "#fecaca";
  let alertTitle = "CRITICAL ALERT";
  let alertDescription =
    "Blood unit is expiring TODAY or within 24 hours. Immediate action required!";

  if (alertLevel === "warning") {
    alertColor = "#f59e0b";
    alertBgColor = "#fffbeb";
    alertBorderColor = "#fde68a";
    alertTitle = "WARNING";
    alertDescription = "Blood unit is expiring within 3 days. Please plan accordingly.";
  } else if (alertLevel === "info") {
    alertColor = "#3b82f6";
    alertBgColor = "#eff6ff";
    alertBorderColor = "#bfdbfe";
    alertTitle = "REMINDER";
    alertDescription = "Blood unit is expiring within 7 days. Review and plan usage.";
  }

  console.log(
    `[DEBUG] Sending blood expiry alert email to ${email} for ${bloodType}`
  );

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${supportEmail}>`,
      to: email,
      subject: `[${alertTitle}] Blood Expiry Alert - ${bloodType} Units at ${hospitalName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${alertBgColor}; border-left: 4px solid ${alertColor}; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: ${alertColor}; margin-top: 0; margin-bottom: 12px;">
              ⚠️ ${alertTitle}: Blood Expiry Alert
            </h2>
            <p style="font-size: 16px; color: #1f2937; margin: 0;">
              ${alertDescription}
            </p>
          </div>

          <p style="font-size: 14px; color: #4b5563;">Dear ${staffName},</p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid ${alertColor}; padding-bottom: 12px;">
              Unit Details
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0; font-weight: 600;">BLOOD TYPE</p>
                <p style="font-size: 18px; color: ${alertColor}; margin: 0; font-weight: bold;">${bloodType}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0; font-weight: 600;">QUANTITY</p>
                <p style="font-size: 18px; color: #1f2937; margin: 0; font-weight: bold;">${quantity} units</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0; font-weight: 600;">DAYS REMAINING</p>
                <p style="font-size: 18px; color: ${alertColor}; margin: 0; font-weight: bold;">${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0; font-weight: 600;">EXPIRES ON</p>
                <p style="font-size: 18px; color: #1f2937; margin: 0; font-weight: bold;">${new Date(expiryDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #15803d; margin-top: 0; margin-bottom: 12px; font-size: 16px;">
              ✓ Recommended Actions
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: #166534;">
              ${
                alertLevel === "critical"
                  ? `
                <li style="margin-bottom: 8px;">Use this blood unit immediately if possible</li>
                <li style="margin-bottom: 8px;">Contact other departments that may need ${bloodType}</li>
                <li style="margin-bottom: 8px;">If not used, properly dispose according to protocols</li>
              `
                  : alertLevel === "warning"
                    ? `
                <li style="margin-bottom: 8px;">Review current patient needs for ${bloodType}</li>
                <li style="margin-bottom: 8px;">Coordinate with other departments for potential use</li>
                <li style="margin-bottom: 8px;">Plan for unit usage within the next 3 days</li>
              `
                    : `
                <li style="margin-bottom: 8px;">Monitor this blood unit's status</li>
                <li style="margin-bottom: 8px;">Plan for usage or safe disposal</li>
                <li style="margin-bottom: 8px;">Check inventory system for updates</li>
              `
              }
            </ul>
          </div>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 12px; font-size: 14px;">
              📋 Hospital Information
            </h3>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>Hospital:</strong> ${hospitalName}
            </p>
            <p style="margin: 8px 0; color: #4b5563;">
              <strong>Alert Level:</strong> 
              <span style="background-color: ${alertBgColor}; color: ${alertColor}; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                ${alertTitle}
              </span>
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.VITE_API_URL || "http://localhost:5000"}/api/health" style="background-color: ${alertColor}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              View Blood Inventory Dashboard
            </a>
          </div>

          <p style="font-size: 12px; color: #6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            This is an automated alert from the LifeFlow Blood Management System. These alerts are critical for maintaining blood supply safety and preventing wastage. Please ensure all staff members monitoring blood inventory receive and review these notifications promptly.
          </p>

          <p style="font-size: 12px; color: #9ca3af;">
            If you have questions about this alert or need to report an issue, please contact your hospital administrator.<br/>
            © ${new Date().getFullYear()} LifeFlow. All rights reserved.
          </p>
        </div>
      `,
    });
    logTestPreview(info);
    console.log(
      `[DEBUG] Blood expiry alert sent successfully to ${email}`
    );
  } catch (error) {
    console.error(`[ERROR] Failed to send blood expiry alert to ${email}:`, error);
    throw error;
  }
}

