import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const RecruiterDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'post', 'applicants'
  const [myJobs, setMyJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  
  // New Job Form State
  const [jobForm, setJobForm] = useState({
    title: '', description: '', company: '', location: '', jobType: 'Full-time', salary: '', experienceLevel: 'Entry Level', skillsRequired: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchMyJobs(), fetchApplicants()]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  const fetchMyJobs = async () => {
    try {
      const res = await api.get('/jobs/mine');
      setMyJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplicants = async () => {
    try {
      const res = await api.get('/applications/company');
      setApplicants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = jobForm.skillsRequired.split(',').map(s => s.trim()).filter(s => s);
      await api.post('/jobs', {
        ...jobForm,
        skillsRequired: skillsArray
      });
      setMessage({ type: 'success', text: 'Job posted successfully!' });
      setJobForm({
        title: '', description: '', company: '', location: '', jobType: 'Full-time', salary: '', experienceLevel: 'Entry Level', skillsRequired: ''
      });
      fetchMyJobs();
      setTimeout(() => setMessage(''), 3000);
      setActiveTab('jobs');
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to post job' });
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      fetchApplicants();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await api.delete(`/jobs/${jobId}`);
      fetchMyJobs();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete job' });
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Recruiter Dashboard</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <button 
              className={`w-full text-left px-6 py-4 font-semibold transition-colors cursor-pointer ${activeTab === 'jobs' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('jobs')}
            >
              My Job Postings
            </button>
            <button 
              className={`w-full text-left px-6 py-4 font-semibold transition-colors cursor-pointer ${activeTab === 'post' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('post')}
            >
              Post a New Job
            </button>
            <button 
              className={`w-full text-left px-6 py-4 font-semibold transition-colors cursor-pointer ${activeTab === 'applicants' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('applicants')}
            >
              Manage Applicants
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full md:w-3/4">
          {message && (
            <div className={`p-4 mb-6 rounded-full font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">My Job Listings</h2>
                <button onClick={() => setActiveTab('post')} className="text-blue-600 font-semibold text-sm hover:underline">
                  + Post New Job
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {myJobs.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium">You haven't posted any jobs yet.</div>
                ) : (
                  myJobs.map(job => (
                    <div key={job._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <Link to={`/jobs/${job._id}`} className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {job.title}
                        </Link>
                        <p className="text-gray-600 mt-1">{job.location} • {job.jobType}</p>
                        <span className="text-xs text-gray-400 font-medium mt-2 block">Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-3 items-center">
                        {confirmDeleteId === job._id ? (
                          <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100 animate-in fade-in duration-200">
                            <span className="text-xs text-red-700 font-semibold">Are you sure?</span>
                            <button
                              onClick={() => {
                                deleteJob(job._id);
                                setConfirmDeleteId(null);
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-red-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(job._id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-full font-bold transition-colors">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'post' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Post a New Job</h2>
              <form onSubmit={handleJobSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                    <input type="text" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                    <input type="text" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                    <input type="text" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" placeholder="e.g. New York, Remote" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Annual Salary (₹ INR)</label>
                    <input type="number" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" placeholder="e.g. 100000" value={jobForm.salary} onChange={e => setJobForm({...jobForm, salary: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Type</label>
                    <select className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900 cursor-pointer" value={jobForm.jobType} onChange={e => setJobForm({...jobForm, jobType: e.target.value})}>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Experience Level</label>
                    <select className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900 cursor-pointer" value={jobForm.experienceLevel} onChange={e => setJobForm({...jobForm, experienceLevel: e.target.value})}>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Required Skills (comma separated)</label>
                  <input type="text" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900" placeholder="React, Node.js, Mongoose" value={jobForm.skillsRequired} onChange={e => setJobForm({...jobForm, skillsRequired: e.target.value})} required />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Job Description</label>
                  <textarea className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 font-medium text-gray-900" value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} required></textarea>
                </div>
                
                <button type="submit" className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition-colors w-full md:w-auto">
                  Post Job
                </button>
              </form>
            </div>
          )}

          {activeTab === 'applicants' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Manage Applicants</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {applicants.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium">No applicants found for your jobs.</div>
                ) : (
                  applicants.map(app => (
                    <div key={app._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="mb-4 md:mb-0">
                        {app.jobId ? (
                          <Link to={`/jobs/${app.jobId?._id}`} className="text-gray-500 font-bold hover:text-blue-600 text-sm mb-1 block">
                            Job: {app.jobId?.title}
                          </Link>
                        ) : (
                          <span className="text-gray-400 italic text-sm mb-1 block">Job Opportunity Deleted</span>
                        )}
                        <h3 className="text-lg font-bold text-gray-900">{app.applicantId?.name}</h3>
                        <p className="text-gray-500 text-sm font-medium">{app.applicantId?.email}</p>
                        
                        <div className="mt-3 flex gap-2 items-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            app.status === 'Shortlisted' ? 'bg-green-100 text-green-800' : 
                            app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            Status: {app.status}
                          </span>
                          {(app.resumeUrl || app.applicantId?.profile?.resumeUrl) && (
                            <a href={`http://localhost:5000${app.resumeUrl || app.applicantId?.profile?.resumeUrl}`} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors border border-blue-200">
                              View Resume
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => updateApplicationStatus(app._id, 'Shortlisted')} disabled={app.status === 'Shortlisted'} className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-4 py-2 rounded-full font-bold disabled:opacity-50 transition-colors text-sm">
                          Shortlist
                        </button>
                        <button onClick={() => updateApplicationStatus(app._id, 'Rejected')} disabled={app.status === 'Rejected'} className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-full font-bold disabled:opacity-50 transition-colors text-sm">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
