const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  workerName: { type: String, required: true },
  startTime: { type: Date, required: true, default: Date.now },
  endTime: { type: Date },
  photo: { type: String },
  status: { type: String, enum: ['working', 'completed'], default: 'working' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

attendanceSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
