const BloodRequest = require('../models/BloodRequest');
const { findEligibleDonors } = require('../services/donorService');
const { sendBloodRequestEmail } = require('../services/emailService');

const requestBlood = async (req, res) => {
  try {
    const { bloodType, urgency, requesterName, requesterContact } = req.body;

    // Create blood request record
    const bloodRequest = new BloodRequest({
      bloodType,
      urgency,
      requesterName,
      requesterContact,
      status: 'active',
      createdAt: new Date()
    });

    await bloodRequest.save();

    // Find eligible donors
    const eligibleDonors = await findEligibleDonors(bloodType);

    if (eligibleDonors.length === 0) {
      return res.status(404).json({ 
        message: 'No eligible donors found',
        requestId: bloodRequest._id 
      });
    }

    // Send emails to all eligible donors
    const emailPromises = eligibleDonors.map(donor =>
      sendBloodRequestEmail(donor.email, donor.name, bloodType, urgency)
    );

    await Promise.all(emailPromises);

    res.status(200).json({
      message: `Blood request created and notifications sent to ${eligibleDonors.length} eligible donors`,
      requestId: bloodRequest._id,
      donorsNotified: eligibleDonors.length
    });
  } catch (error) {
    console.error('Error in requestBlood:', error);
    res.status(500).json({ error: 'Failed to process blood request' });
  }
};

module.exports = {
  requestBlood
};
