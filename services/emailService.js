const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendBloodRequestEmail = async (recipientEmail, donorName, bloodType, urgency) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `Urgent: Blood Request for ${bloodType}`,
    html: `
      <h2>Blood Request Notification</h2>
      <p>Dear ${donorName},</p>
      <p>There is an urgent request for <strong>${bloodType}</strong> blood type.</p>
      <p><strong>Urgency Level:</strong> ${urgency}</p>
      <p>Your blood type matches the requirement. Please contact us at your earliest convenience if you are willing to donate.</p>
      <p>
        <a href="${process.env.APP_URL}/donor/respond" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Respond to Request
        </a>
      </p>
      <p>Thank you for your generosity!</p>
      <p>Bloodflow Hub Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendBloodRequestEmail
};
