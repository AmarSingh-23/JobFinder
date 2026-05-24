const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const multer = require('multer');
const pdfParse = require('pdf-parse');

// ✅ IMPORTANT: use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create a job (Company only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: 'Only companies can post jobs' });
    }

    const { title, description, company, location, jobType, salary, experienceLevel } = req.body;
    if (!title || !description || !company || !location || !jobType || !salary || !experienceLevel) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (Number(salary) <= 0) {
      return res.status(400).json({ message: 'Salary must be a positive number' });
    }

    const newJob = new Job({ title, description, company, location, category: req.body.category, jobType, salary: Number(salary), experienceLevel, skillsRequired: req.body.skillsRequired || [], recruiterId: req.user.id });
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    res.status(500).json({ message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: err.message }) });
  }
});

// Get all jobs (with advanced search and filtering)
router.get('/', async (req, res) => {
  try {
    const { keyword, location, jobType, category, experienceLevel, minSalary, sort } = req.query;
    let query = {};
    
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { company: { $regex: keyword, $options: 'i' } },
        { skillsRequired: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (location) query.location = { $regex: location, $options: 'i' };
    if (jobType) query.jobType = jobType;
    if (category) query.category = category;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (minSalary) query.salary = { $gte: Number(minSalary) };

    let sortObj = { createdAt: -1 };
    if (sort === 'salary') {
      sortObj = { salary: -1 };
    } else if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    }

    const pageVal = parseInt(req.query.page) || 1;
    const limitVal = Math.min(parseInt(req.query.limit) || 10, 50);
    const skipVal = (pageVal - 1) * limitVal;

    let jobsQuery = Job.find(query).populate('recruiterId', 'name email').sort(sortObj);
    if (req.query.page || req.query.limit) {
      jobsQuery = jobsQuery.skip(skipVal).limit(limitVal);
    }
    const jobs = await jobsQuery;
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: err.message }) });
  }
});

// AI-based search using resume upload
router.post('/ai-search', upload.single('resume'), async (req, res) => {
  try {
    // ✅ 1. File validation
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    if (!req.file.buffer) {
      return res.status(400).json({ message: 'File buffer missing' });
    }

    // ✅ 2. Safe PDF parsing
    let resumeText = '';
    try {
      const pdfData = await pdfParse(req.file.buffer);
      resumeText = pdfData.text.toLowerCase();
    } catch (pdfError) {
      console.error('PDF PARSE ERROR:', pdfError);
      return res.status(400).json({ message: 'Invalid or corrupted PDF file' });
    }

    // ✅ 3. Skill extraction
    const allSkills = [
      'react', 'node', 'javascript', 'python', 'java', 'c++', 'ruby', 'php',
      'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'html', 'css',
      'typescript', 'express', 'django', 'spring', 'angular', 'vue',
      'machine learning', 'data science', 'frontend', 'backend', 'fullstack'
    ];

    let extractedSkills = allSkills.filter(skill =>
      resumeText.includes(skill)
    );

    // fallback keywords
    if (extractedSkills.length === 0) {
      const words = resumeText
        .split(/\s+/)
        .filter(w => w.length > 4 && /^[a-zA-Z]+$/.test(w));

      extractedSkills = words.slice(0, 5);
    }

    // ✅ 4. Safe Mongo query
    let jobs = [];

    if (extractedSkills.length > 0) {
      const query = {
        $or: extractedSkills.map(skill => ({
          $or: [
            { title: { $regex: skill, $options: 'i' } },
            { description: { $regex: skill, $options: 'i' } },
            { skillsRequired: { $regex: skill, $options: 'i' } }
          ]
        }))
      };

      jobs = await Job.find(query)
        .populate('recruiterId', 'name email')
        .limit(10);
    } else {
      jobs = await Job.find()
        .populate('recruiterId', 'name email')
        .limit(10);
    }

    // ✅ 5. Response
    res.json({
      extractedSkills,
      suggestedJobs: jobs
    });

  } catch (err) {
    console.error('AI Search Error FULL:', err);
    res.status(500).json({
      message: 'Error processing resume',
      error: err.message
    });
  }
});

// Get jobs posted by the logged-in recruiter (Company only)
router.get('/mine', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: 'Only companies can view their jobs' });
    }
    const jobs = await Job.find({ recruiterId: req.user.id }).populate('recruiterId', 'name email').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: err.message }) });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const job = await Job.findById(req.params.id).populate('recruiterId', 'name email');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: err.message }) });
  }
});

// Edit a job (Company only)
router.put('/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this job' });
    }

    const { title, description, company, location, category, jobType, salary, experienceLevel, skillsRequired } = req.body;
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, { title, description, company, location, category, jobType, salary, experienceLevel, skillsRequired }, { new: true, runValidators: true });
    res.json(updatedJob);
  } catch (err) {
    res.status(500).json({ message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: err.message }) });
  }
});

// Delete a job (Company only)
router.delete('/:id', auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    if (job.recruiterId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    res.json({ message: 'Job removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', ...(process.env.NODE_ENV !== 'production' && { error: err.message }) });
  }
});

module.exports = router;
