const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  routeGroup: { type: String, required: true },
  mapsLink: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

shopSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Shop', shopSchema);
