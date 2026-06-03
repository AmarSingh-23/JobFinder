const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true },
  jobType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'], required: true }, // Full-time, Part-time, Contract, etc.
  salary: { type: Number, required: true },
  experienceLevel: { type: String, enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'], required: true },
  skillsRequired: [{ type: String }],
  applicantsCount: { type: Number, default: 0 },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

jobSchema.index({ recruiterId: 1, createdAt: -1 });
jobSchema.index({ title: 'text', description: 'text', skillsRequired: 'text' });

module.exports = mongoose.model('Job', jobSchema);