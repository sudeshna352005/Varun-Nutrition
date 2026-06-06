const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  packSize: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  workerName: { type: String, required: true, index: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  shopName: { type: String, required: true, index: true },
  routeName: { type: String, required: true, index: true },
  items: [orderItemSchema],
  totalQuantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'delivered', 'cancelled'], default: 'pending', index: true },
  deliveredAt: { type: Date },
  notes: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Order', orderSchema);
