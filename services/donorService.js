const Donor = require('../models/Donor');

const findEligibleDonors = async (bloodType) => {
  try {
    const eligibleDonors = await Donor.find({
      bloodType: bloodType,
      isEligible: true,
      status: 'active'
    }).select('name email phone');
    
    return eligibleDonors;
  } catch (error) {
    console.error('Error finding eligible donors:', error);
    throw error;
  }
};

module.exports = {
  findEligibleDonors
};
