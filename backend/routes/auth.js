const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { getOTPTemplate, getPasswordResetTemplate } = require('../utils/emailTemplates');
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: 'Too many attempts, please try again after 15 minutes' } });


// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be self-registered' });
    }

    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Only Gmail addresses are allowed' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password, role, profile: {} });

    // All new accounts are unverified by default
    user.isVerified = false;

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // For user and admin roles: email verification via OTP
    if (role === 'user' || role === 'admin') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      user.otp = await bcrypt.hash(otp, salt);
      user.otpExpires = Date.now() + 5 * 60 * 1000;

      try {
        await sendEmail({
          email: user.email,
          subject: '🔐 Verify Your Email - OTP Code',
          message: `Your OTP is ${otp}`,
          html: getOTPTemplate(otp, user.name)
      });
      } catch (err) {
        console.error('Email not sent', err);
      }
    }

    await user.save();

    res.status(201).json({
      message: 'Registration successful. Complete verification if required.',
      userId: user._id
    });
  } catch (err) {
    console.error('[DEBUG] Catch error in /register:', err);
    res.status(500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// Resend OTP
router.post('/resend-otp', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    user.otp = await bcrypt.hash(otp, salt);
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 Verify Your Email - OTP Code',
        message: `Your OTP is ${otp}`,
        html: getOTPTemplate(otp, user.name)
      });
      res.status(200).json({ message: 'A new OTP has been sent to your email.' });
    } catch (err) {
      console.error('Email not sent', err);
      res.status(500).json({ message: 'Failed to send OTP email.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// Verify Registration OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });
    if (user.role !== 'user' && user.role !== 'admin') return res.status(400).json({ message: 'Not applicable for this role' });

    const isOtpValid = user.otp && await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.role === 'admin' && user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP Expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Only Gmail addresses are allowed' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    // Require role and check
    if (!role) return res.status(400).json({ message: 'Role is required for login' });
    if (user.role !== role) {
      return res.status(400).json({ message: 'Account role mismatch' });
    }

    if (user.role === 'admin' && user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    if (!user.isVerified) {
      if (user.role === 'user' || user.role === 'admin') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        user.otp = await bcrypt.hash(otp, salt);
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        await user.save();

        try {
          await sendEmail({
            email: user.email,
            subject: '🔐 Verify Your Email - OTP Code',
            message: `Your OTP is ${otp}`,
            html: getOTPTemplate(otp, user.name)
          });
        } catch (err) {
          console.error('Email not sent', err);
        }
        return res.status(403).json({ message: 'Please verify your email via OTP before logging in. A new OTP has been sent.', needsVerification: true });
      }
      if (user.role === 'company') return res.status(403).json({ message: 'Your company profile is pending admin approval' });
    }

    const payload = { id: user.id, role: user.role, email: user.email };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
      if (err) throw err;

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      res.status(200).json({ user: { id: user.id, name: user.name, email, role: user.role } });
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (role && user.role !== role) return res.status(400).json({ message: 'Account role mismatch' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    user.otp = await bcrypt.hash(otp, salt);
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: '🔐 Password Reset - OTP Code',
        message: `Your OTP is ${otp}`,
        html: getPasswordResetTemplate(otp, user.name)
      });
      res.status(200).json({ message: 'OTP sent to your email' });
    } catch (err) {
      res.status(200).json({ message: 'OTP generated (Check server logs)' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isOtpValid = user.otp && await bcrypt.compare(otp, user.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP Expired' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// Logout - Clear cookie
router.delete('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin ONLY: Verify Company
router.post('/admin/verify-company', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { companyId } = req.body;
    const company = await User.findById(companyId);
    if (!company || company.role !== 'company') return res.status(404).json({ message: 'Company not found' });

    company.isVerified = true;
    await company.save();

    res.status(200).json({ message: 'Company verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin ONLY: Reject & Delete Company
router.delete('/admin/reject-company', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const { companyId } = req.body;
    const company = await User.findById(companyId);
    if (!company || company.role !== 'company') return res.status(404).json({ message: 'Company not found' });

    await company.deleteOne();
    res.status(200).json({ message: 'Company rejected and account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Admin ONLY: get pending companies
router.get('/admin/pending-companies', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    const companies = await User.find({ role: 'company', isVerified: false }).select('-password');
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;