const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  assignedRoutes: { type: [String], default: [], index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

workerSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Worker', workerSchema);
