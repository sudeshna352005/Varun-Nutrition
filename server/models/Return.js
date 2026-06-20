const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnId: { type: String, unique: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  shopName: { type: String, required: true, index: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  workerName: { type: String, required: true, index: true },
  routeName: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productName: { type: String, required: true },
  quantityReturned: { type: Number, required: true },
  reason: {
    type: String,
    required: true,
    enum: ['Damaged', 'Expired', 'Unsold Stock', 'Wrong Product', 'Packaging Issue', 'Customer Complaint', 'Other']
  },
  notes: { type: String },
  returnPhoto: { type: String },
  returnValue: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

returnSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

returnSchema.pre('save', function(next) {
  if (!this.returnId) {
    this.returnId = 'RET-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Return', returnSchema);
