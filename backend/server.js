const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
if (!process.env.JWT_SECRET) { console.error('FATAL: JWT_SECRET is not set'); process.exit(1); }

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.set('trust proxy', 1);
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/users', require('./routes/users'));

const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}


// Database Connection
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};

const seedDatabase = async () => {
  const Job = require('./models/Job');
  const User = require('./models/User');
  try {
    const jobCount = await Job.countDocuments();
    if (jobCount < 5) {
      console.log('Seeding mock jobs into database...');
      // Clear old seed data to ensure clean state
      await Job.deleteMany({});
      await User.deleteMany({ email: 'recruiter@techcorp.com' });

      const bcrypt = require('bcryptjs');
      const seedPassword = await bcrypt.hash('TechCorp@Seed123', 10);
      const mockRecruiter = await User.create({
        name: 'Tech Corp Admin',
        email: 'recruiter@techcorp.com',
        password: seedPassword,
        role: 'company',
        isVerified: true,
        profile: { companyName: 'Tech Corp', companyDescription: 'Leading Innovators' }
      });

      await Job.insertMany([
        {
          title: 'Frontend Developer',
          description: 'Looking for a skilled React developer with modern CSS and Tailwind experience.',
          company: 'Tech Corp',
          location: 'Remote',
          category: 'IT & Software',
          jobType: 'Full-time',
          salary: 1200000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['React', 'JavaScript', 'Tailwind', 'CSS'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Backend Node Engineer',
          description: 'Build and maintain scalable APIs using Node.js, Express, and MongoDB.',
          company: 'Tech Corp',
          location: 'Bangalore, India',
          category: 'IT & Software',
          jobType: 'Full-time',
          salary: 1800000,
          experienceLevel: 'Senior Level',
          skillsRequired: ['Node.js', 'Express', 'MongoDB', 'JavaScript'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'UX Designer',
          description: 'Design beautiful user interfaces and optimize customer flows using Figma.',
          company: 'Creative Studio',
          location: 'Mumbai, India',
          category: 'Design',
          jobType: 'Contract',
          salary: 900000,
          experienceLevel: 'Entry Level',
          skillsRequired: ['Figma', 'Prototyping', 'UX Research'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Data Scientist',
          description: 'Extract insights from complex datasets and build predictive machine learning models.',
          company: 'Analytica',
          location: 'Bangalore, India',
          category: 'IT & Software',
          jobType: 'Full-time',
          salary: 2200000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['Python', 'SQL', 'Machine Learning', 'Pandas'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Project Manager',
          description: 'Manage timeline, resources, and communication for enterprise software delivery.',
          company: 'BuildScale',
          location: 'Delhi / NCR',
          category: 'Business',
          jobType: 'Full-time',
          salary: 1500000,
          experienceLevel: 'Senior Level',
          skillsRequired: ['Agile', 'Scrum', 'Jira', 'Leadership'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'HR Specialist',
          description: 'Handle talent acquisition, onboarding, employee engagement, and payroll operations.',
          company: 'People First',
          location: 'Hyderabad, India',
          category: 'HR',
          jobType: 'Full-time',
          salary: 600000,
          experienceLevel: 'Entry Level',
          skillsRequired: ['Recruitment', 'Communication', 'HRMS'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Digital Marketing Manager',
          description: 'Drive growth through SEO, SEM, content strategy, and social media campaigns.',
          company: 'GrowthGen',
          location: 'Remote',
          category: 'Marketing',
          jobType: 'Part-time',
          salary: 800000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['SEO', 'Google Analytics', 'Content Writing'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Mobile App Developer',
          description: 'Build native-performing cross-platform iOS and Android apps using Flutter.',
          company: 'AppFactory',
          location: 'Pune, India',
          category: 'IT & Software',
          jobType: 'Full-time',
          salary: 1100000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['Flutter', 'Dart', 'Mobile Apps', 'REST APIs'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'DevOps Engineer',
          description: 'Automate CI/CD pipelines, manage AWS cloud infrastructure, and monitor systems.',
          company: 'CloudOps',
          location: 'Chennai, India',
          category: 'Engineering',
          jobType: 'Full-time',
          salary: 1600000,
          experienceLevel: 'Senior Level',
          skillsRequired: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'B2B Sales Executive',
          description: 'Identify prospects, present our SaaS platform, close sales, and maintain accounts.',
          company: 'BizReach',
          location: 'Mumbai, India',
          category: 'Sales',
          jobType: 'Full-time',
          salary: 750000,
          experienceLevel: 'Entry Level',
          skillsRequired: ['Sales', 'Negotiation', 'CRM', 'Cold Calling'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Technical Content Writer',
          description: 'Write developer guides, documentation, blog posts, and educational web resources.',
          company: 'MediaCraft',
          location: 'Remote',
          category: 'Marketing',
          jobType: 'Contract',
          salary: 500000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['Technical Writing', 'Copywriting', 'SEO'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'QA Automation Engineer',
          description: 'Write automated test cases using Selenium and Cypress to ensure software quality.',
          company: 'QualityMatters',
          location: 'Pune, India',
          category: 'IT & Software',
          jobType: 'Full-time',
          salary: 850000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['Selenium', 'Cypress', 'JavaScript', 'QA Testing'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Financial Analyst',
          description: 'Provide commercial intelligence, model budgets, track costs, and evaluate investments.',
          company: 'CapitalGroup',
          location: 'Delhi / NCR',
          category: 'Business',
          jobType: 'Full-time',
          salary: 1300000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['Excel', 'Financial Modeling', 'Data Analysis'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Full Stack Engineer',
          description: 'Help develop our core React frontend and Node/Express backend APIs.',
          company: 'SaaSify',
          location: 'Remote',
          category: 'IT & Software',
          jobType: 'Full-time',
          salary: 1400000,
          experienceLevel: 'Mid Level',
          skillsRequired: ['React', 'Node.js', 'Express', 'MongoDB'],
          recruiterId: mockRecruiter._id
        },
        {
          title: 'Machine Learning Research Engineer',
          description: 'Research state-of-the-art NLP models and deploy deep learning pipelines in PyTorch.',
          company: 'AI Labs',
          location: 'Bangalore, India',
          category: 'IT & Software',
          jobType: 'Full-time',
          salary: 2400000,
          experienceLevel: 'Senior Level',
          skillsRequired: ['Python', 'PyTorch', 'NLP', 'Machine Learning'],
          recruiterId: mockRecruiter._id
        }
      ]);
      console.log('Database seeded successfully with 15 mock jobs.');
    }
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
};

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  await seedDatabase();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});