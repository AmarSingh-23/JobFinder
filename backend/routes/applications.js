const express = require('express');
const router = express.Router();
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { getJobAppliedTemplate } = require('../utils/emailTemplates');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + '-apply-' + Date.now() + path.extname(file.originalname));
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

// Apply for a job (User only)
router.post('/:jobId', auth, handleResumeUploadMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Only job seekers can apply' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ jobId: req.params.jobId, applicantId: req.user.id });
    if (existingApplication) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const { applicantName, applicantEmail, applicantPhone } = req.body;
    if (!applicantName || !applicantEmail || !applicantPhone) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }

    // Validate phone number format (Indian phone numbers)
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    const strippedPhone = applicantPhone.replace(/[\s-]/g, '');
    if (!phoneRegex.test(strippedPhone)) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Please enter a valid 10-digit Indian phone number (e.g. +91 98765 43210 or 9876543210)' });
    }

    // Check if the uploaded PDF is actually a resume
    if (req.file) {
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
    }

    const newApplication = new Application({
      jobId: req.params.jobId,
      applicantId: req.user.id,
      recruiterId: job.recruiterId,
      resumeUrl: req.file ? `/api/users/file/${req.file.filename}` : '',
      applicantName,
      applicantEmail,
      applicantPhone
    });

    const savedApplication = await newApplication.save();

    // Increment applicants count
    await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicantsCount: 1 } });

    const applicant = await User.findById(req.user.id);
    try {
      if (applicant && applicant.email) {
        await sendEmail({
          email: applicant.email,
          subject: `Application Submitted - ${job.title} at ${job.company}`,
          message: `Your application for ${job.title} at ${job.company} was submitted successfully.`,
          html: getJobAppliedTemplate(job.title, job.company, applicant.name)
        });
      }
    } catch (emailErr) {
      console.error('Job Applied Email Failed:', emailErr);
    }

    res.status(201).json(savedApplication);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get applications for a company's jobs
router.get('/company', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const applications = await Application.find({ recruiterId: req.user.id })
      .populate('jobId', 'title')
      .populate('applicantId', 'name email profile')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a user's own applications (User)
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const applications = await Application.find({ applicantId: req.user.id })
      .populate('jobId', 'title company location salary jobType')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update application status (Company only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status } = req.body;
    if (!['Pending', 'Shortlisted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.recruiterId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;