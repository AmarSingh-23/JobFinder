import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const JobSeekerDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('applications');
  const [profileData, setProfileData] = useState({
    skills: user?.profile?.skills?.join(', ') || '',
    education: user?.profile?.education || '',
    experience: user?.profile?.experience || '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications/me');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = profileData.skills.split(',').map(s => s.trim()).filter(s => s);
      const res = await api.put('/users/profile', {
        ...profileData,
        skills: skillsArray
      });
      setUser(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setResumeFile(null);
      return;
    }

    // Validate file type
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setMessage({ type: 'error', text: 'Only PDF files are allowed.' });
      setResumeFile(null);
      e.target.value = null; // clear input
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size too large. Maximum size allowed is 5MB.' });
      setResumeFile(null);
      e.target.value = null; // clear input
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Clear previous error messages if valid
    if (message && message.type === 'error') {
      setMessage('');
    }
    setResumeFile(selectedFile);
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    
    try {
      await api.post('/users/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
      api.get('/auth/me').then(response => setUser(response.data));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload resume' });
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">My Dashboard</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <button 
              className={`w-full text-left px-6 py-4 font-semibold transition-colors ${activeTab === 'applications' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('applications')}
            >
              My Applications
            </button>
            <button 
              className={`w-full text-left px-6 py-4 font-semibold transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile Settings
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

          {activeTab === 'applications' && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Application History</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {applications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium">You haven't applied to any jobs yet.</div>
                ) : (
                  applications.map(app => (
                    <div key={app._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        {app.jobId ? (
                          <>
                            <Link to={`/jobs/${app.jobId?._id}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                              {app.jobId?.title}
                            </Link>
                            <p className="text-gray-600 font-medium">{app.jobId?.company} • {app.jobId?.location}</p>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-bold text-gray-500 italic">Deleted Job Opportunity</span>
                            <p className="text-gray-600 font-medium">Company details unavailable</p>
                          </>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0 flex flex-col items-end">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          app.status === 'Shortlisted' ? 'bg-green-100 text-green-800' : 
                          app.status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status}
                        </span>
                        <span className="text-xs text-gray-400 mt-2 font-medium">Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Update Profile</h2>
                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Skills (comma separated)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      placeholder="React, Node.js, Python"
                      value={profileData.skills}
                      onChange={(e) => setProfileData({...profileData, skills: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Education</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      placeholder="B.S. Computer Science"
                      value={profileData.education}
                      onChange={(e) => setProfileData({...profileData, education: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Experience</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-32 font-medium"
                      placeholder="Brief summary of your work experience..."
                      value={profileData.experience}
                      onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                    ></textarea>
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors">
                    Save Profile
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Resume</h2>
                {user?.profile?.resumeUrl ? (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-between">
                    <span className="font-medium text-blue-800">Current Resume is Uploaded</span>
                    <a href={`http://localhost:5000${user.profile.resumeUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 bg-white px-4 py-2 rounded-md font-bold shadow-sm hover:bg-blue-50 transition-colors border border-blue-200">View PDF</a>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-full font-medium border border-yellow-200">
                    No resume uploaded yet. Recruiter won't be able to review your application effectively.
                  </div>
                )}
                
                <form onSubmit={handleResumeUpload} className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload New Resume (PDF, Max 5MB)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="w-full p-2 block text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer border border-gray-100 rounded-full"
                      onChange={handleFileChange}
                    />
                  </div>
                  <button type="submit" disabled={!resumeFile} className="w-full sm:w-auto bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
                    Upload
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
