const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  workerName: { type: String, required: true },
  month: { type: String, required: true, index: true }, // Format: YYYY-MM
  presentDays: { type: Number, default: 0 },
  dailySalary: { type: Number, default: 0 },
  additionalAllowance: { type: Number, default: 0 },
  baseSalary: { type: Number, default: 0 },
  additionalAmount: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  notes: { type: String },
  status: { type: String, enum: ['draft', 'paid'], default: 'draft' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

payrollSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Payroll', payrollSchema);
