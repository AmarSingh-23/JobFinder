const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'company', 'admin'], required: true },
  isVerified: { type: Boolean, default: false }, // for email/admin verification
  otp: { type: String }, // For email verification or forgot password
  otpExpires: { type: Date },
  profile: {
    skills: [{ type: String }],
    education: { type: String },
    experience: { type: String },
    resumeUrl: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);