const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  workerName: { type: String, required: true },
  notes: { type: String },
  timestamp: { type: Date, required: true, default: Date.now },
  photo: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

visitSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Visit', visitSchema);
