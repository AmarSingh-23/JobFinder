import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import usePageTitle from '../hooks/usePageTitle';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [modalError, setModalError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { showToast } = useToast();
  usePageTitle(job ? job.title : 'Job Details');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    resume: null
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (user && showModal) {
      setFormData((prev) => ({
        ...prev,
        applicantName: user.name || '',
        applicantEmail: user.email || ''
      }));
    }
  }, [user, showModal]);

  const handleApplyClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setModalError('');
    setShowModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number format (Indian phone numbers)
    const strippedPhone = formData.applicantPhone.replace(/[\s-]/g, '');
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(strippedPhone)) {
      setModalError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setApplying(true);
    setModalError('');
    
    try {
      const data = new FormData();
      data.append('applicantName', formData.applicantName);
      data.append('applicantEmail', formData.applicantEmail);
      data.append('applicantPhone', formData.applicantPhone);
      if (formData.resume) {
        data.append('resume', formData.resume);
      }

      await api.post(`/applications/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      showToast('Application submitted successfully!', 'success');
      setShowModal(false);
    } catch (err) {
      console.error("Full error response:", err.response?.data);
      const errMsg = err.response?.data?.message || err.response?.data?.error || '';
      if (errMsg.toLowerCase().includes('already applied')) {
        showToast('You have already applied for this job', 'warning');
        setShowModal(false);
      } else {
        showToast('Failed to submit application. Try again.', 'error');
        setModalError(errMsg || 'Failed to apply');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'resume') {
      const selectedFile = files[0];
      if (!selectedFile) {
        setFormData({ ...formData, resume: null });
        return;
      }

      // Validate file type
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setModalError('Only PDF files are allowed.');
        setFormData({ ...formData, resume: null });
        e.target.value = null; // clear input value
        setTimeout(() => setModalError(''), 5000);
        return;
      }

      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setModalError('File size too large. Maximum size allowed is 5MB.');
        setFormData({ ...formData, resume: null });
        e.target.value = null; // clear input value
        setTimeout(() => setModalError(''), 5000);
        return;
      }

      // Clear any previous error messages if valid
      if (modalError) {
        setModalError('');
      }

      setFormData({ ...formData, resume: selectedFile });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (loading) return <div className="text-center py-20 font-bold">Loading...</div>;
  if (!job) return <div className="text-center py-20 font-bold">Job not found</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="p-8 md:p-10 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl text-gray-600 font-medium">{job.company}</p>
            </div>
            {(!user || user.role === 'user') && (
              <button
                onClick={handleApplyClick}
                disabled={applying}
                className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50"
              >
                Apply Now
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-8 text-sm text-gray-600 font-medium">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {job.location}
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              {job.jobType}
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ₹{job.salary?.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              {job.experienceLevel}
            </span>
          </div>
        </div>
        <div className="p-8 md:p-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Job Description</h3>
          <div className="prose max-w-none text-gray-600 mb-10 whitespace-pre-line">
            {job.description}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-4">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.skillsRequired?.map((skill, index) => (
              <span key={index} className="border border-gray-200 bg-gray-50 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => { setShowModal(false); setModalError(''); }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for {job.title}</h2>
            {modalError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium">
                {modalError}
              </div>
            )}
            <form onSubmit={handleApplySubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input required type="text" name="applicantName" value={formData.applicantName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input required readOnly type="email" name="applicantEmail" value={formData.applicantEmail} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-gray-50 cursor-not-allowed" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Indian format)</label>
                <input required type="tel" name="applicantPhone" value={formData.applicantPhone} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume / CV (PDF, Max 5MB)</label>
                <div className="w-full items-center justify-center relative">
                  <input required type="file" name="resume" accept="application/pdf" onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all outline-none cursor-pointer" />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => { setShowModal(false); setModalError(''); }} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={applying} className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50">
                  {applying ? 'Submitting...' : 'Submit Form'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
