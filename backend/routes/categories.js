const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CategoryRequest = require('../models/CategoryRequest');
const Job = require('../models/Job');

// Company requests a new category
router.post('/request', auth, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: 'Only companies can request categories' });
    }
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const existing = await CategoryRequest.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      status: 'pending' 
    });
    if (existing) return res.status(400).json({ message: 'This category is already pending approval' });

    const request = await CategoryRequest.create({
      name,
      requestedBy: req.user.id,
      companyName: req.user.companyName || 'Unknown Company'
    });
    res.status(201).json({ message: 'Category request submitted for admin approval', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin gets all pending category requests
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const requests = await CategoryRequest.find({ status: 'pending' })
      .populate('requestedBy', 'name email companyName')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin approves a category request
router.put('/approve/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const request = await CategoryRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Add category to Job model enum dynamically via a separate approved list
    res.json({ message: `Category "${request.name}" approved successfully`, request });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin rejects a category request
router.put('/reject/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const request = await CategoryRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ message: `Category "${request.name}" rejected`, request });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all approved categories (for job posting dropdown)
router.get('/approved', async (req, res) => {
  try {
    const defaultCategories = [
      'IT & Software', 'Design', 'Marketing', 'Sales', 
      'HR', 'Business', 'Engineering', 'Finance', 'Education', 'Other'
    ];
    const approvedRequests = await CategoryRequest.find({ status: 'approved' })
      .select('name')
      .sort({ name: 1 });
    const customCategories = approvedRequests.map(r => r.name);
    const allCategories = [...new Set([...defaultCategories, ...customCategories])].sort();
    res.json(allCategories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
