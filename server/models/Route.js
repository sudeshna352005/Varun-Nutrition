const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

routeSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Route', routeSchema);
