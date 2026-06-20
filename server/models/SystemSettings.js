const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Varun Nutritions' },
  companyLogo: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  businessAddress: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
