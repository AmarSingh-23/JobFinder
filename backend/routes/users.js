const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const User = require('../models/User');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// Setup multer for resume upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, req.user.id + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  }
});

const uploadSingle = upload.single('resume');

// Wrapper middleware to handle multer errors cleanly
const handleResumeUploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large. Max limit is 5MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { skills, education, experience } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (skills) user.profile.skills = skills;
    if (education) user.profile.education = education;
    if (experience) user.profile.experience = experience;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Upload resume
router.post('/resume', auth, handleResumeUploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Check if the uploaded PDF is actually a resume
    const dataBuffer = fs.readFileSync(req.file.path);
    let parsedPdf;
    try {
      parsedPdf = await pdfParse(dataBuffer);
    } catch (pdfErr) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid or corrupted PDF file' });
    }

    const text = parsedPdf.text.toLowerCase();
    const keywords = ['skills', 'education', 'experience', 'work', 'project', 'resume', 'cv', 'contact', 'profile', 'employment'];
    let matches = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matches++;
      }
    }

    // Require at least 2 keywords to match
    if (matches < 2) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'The uploaded file does not look like a valid resume. Please upload a PDF containing your experience, skills, education, or contact details.' });
    }

    const user = await User.findById(req.user.id);
    user.profile.resumeUrl = `/api/users/file/${req.file.filename}`;
    await user.save();
    res.json({ message: 'Resume uploaded successfully', resumeUrl: user.profile.resumeUrl });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Basic Skill-based Job Recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only job seekers can get recommendations' });
    }
    const user = await User.findById(req.user.id);
    const userSkills = user.profile.skills || [];
    
    if (userSkills.length === 0) {
      // If no skills, just return latest jobs
      const jobs = await Job.find().sort({ createdAt: -1 }).limit(10);
      return res.json(jobs);
    }

    // Find jobs that have at least one matching skill
    const jobs = await Job.find({
      skillsRequired: { $in: userSkills }
    }).populate('recruiterId', 'name company');

    // Sort jobs by number of matching skills
    jobs.sort((a, b) => {
      const aMatches = a.skillsRequired.filter(s => userSkills.includes(s)).length;
      const bMatches = b.skillsRequired.filter(s => userSkills.includes(s)).length;
      return bMatches - aMatches; // descending
    });

    res.json(jobs.slice(0, 10)); // Top 10 recommendations
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get public platform statistics
router.get('/stats', async (req, res) => {
  try {
    const Job = require('../models/Job');
    const totalCompanies = await User.countDocuments({ role: 'company' });
    const totalJobs = await Job.countDocuments();
    
    res.json({ totalCompanies, totalJobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/file/:filename', auth, (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.sendFile(path.resolve(filePath));
});

module.exports = router;
