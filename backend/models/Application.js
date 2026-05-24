const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Shortlisted', 'Rejected'], default: 'Pending' },
  resumeUrl: { type: String },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  applicantPhone: { type: String, required: true }
}, { timestamps: true });

applicationSchema.index({ jobId: 1, applicantId: 1 });
applicationSchema.index({ recruiterId: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
