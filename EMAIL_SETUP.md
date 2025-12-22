# Email Configuration Guide for LifeFlow Contact Form

## Overview
The Contact Us page now sends emails to `bloodflowhub@gmail.com` when users submit the contact form. Two emails are sent:
1. **Admin notification** - Sent to the LifeFlow team's inbox
2. **User confirmation** - Sent to the user's email confirming receipt

## Setup Instructions

### 1. Gmail App Password Setup
Since Gmail requires special authentication for third-party apps, you need to generate an **App Password**:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go back to Security settings and find **App passwords**
4. Select **Mail** and **Windows Computer** (or your device)
5. Google will generate a 16-character password
6. Copy this password

### 2. Configure Environment Variables
1. Open `.env` file in the root directory
2. Update the following variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=bloodflowhub@gmail.com
   SMTP_PASS=your_16_char_app_password_here
   SMTP_FROM_EMAIL=bloodflowhub@gmail.com
   SMTP_FROM_NAME=LifeFlow - Blood Donation Hub
   ```

3. **Replace** `your_16_char_app_password_here` with the actual App Password from Google

### 3. Important Notes
- **Never commit the `.env` file** - It contains sensitive credentials
- The `.env` file is already in `.gitignore` for security
- Use `.env.example` as a template for new environments
- Keep the password secure and don't share it

## How It Works

### Frontend (Contact Form)
- User fills out the contact form on `/contact` page
- Form validates all required fields
- On submission, sends a POST request to `/api/contact`

### Backend
- `/api/contact` endpoint receives the form data
- Validates email format and required fields
- Sends two emails using Nodemailer:
  - Admin email with full submission details
  - User confirmation email with messaging about response time
- Returns success/error response to frontend

### Email Templates
Both emails use professional HTML templates with:
- Clear subject lines
- Formatted message content
- Emergency disclaimer for safety
- Professional styling with LifeFlow branding

## Testing

### Local Testing
1. Make sure `.env` is configured with valid credentials
2. Start the dev server: `npm run dev`
3. Navigate to `http://localhost:5000/contact`
4. Fill out the form and submit
5. Check the LifeFlow inbox and your email for confirmations

### Troubleshooting

**"Failed to send message" error:**
- Check that your App Password is correct (16 characters with spaces removed)
- Verify 2-Step Verification is enabled on the Gmail account
- Ensure the Gmail account allows less secure app access if using an older auth method
- Check that SMTP credentials in `.env` are properly formatted

**Emails not arriving:**
- Check spam/junk folder
- Verify the sender email is `bloodflowhub@gmail.com`
- Check Gmail activity log at [myaccount.google.com/security-checkup](https://myaccount.google.com/security-checkup)

## Production Deployment

For production, consider:
1. Using environment variables from your hosting provider
2. Setting up a dedicated email service account
3. Adding email logging and monitoring
4. Implementing rate limiting on the contact endpoint
5. Adding CAPTCHA for form spam protection

## Files Modified/Created

- ✅ `server/email.ts` - Email service with Nodemailer
- ✅ `server/routes.ts` - Contact form API endpoint
- ✅ `client/src/pages/ContactPage.tsx` - Updated to call API
- ✅ `.env` - Environment variables (local only)
- ✅ `.env.example` - Template for developers
- ✅ `.gitignore` - Updated to exclude .env files
