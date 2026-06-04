import React, { useState } from 'react';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import usePageTitle from '../hooks/usePageTitle';

const AiSearch = () => {
  usePageTitle('AI Match');
  const [file, setFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) {
      setFile(null);
      setError('');
      return;
    }

    // Validate file type
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed.');
      setFile(null);
      e.target.value = null; // clear input
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size allowed is 5MB.');
      setFile(null);
      e.target.value = null; // clear input
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume file (PDF)');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/jobs/ai-search', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setJobs(res.data.suggestedJobs || []);
      setSkills(res.data.extractedSkills || []);
      setSearched(true);
    } catch (err) {
      console.error('Error during AI search', err);
      setError('Failed to process resume. Make sure it is a valid PDF file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-[2rem] p-8 md:p-12 text-center text-white mb-10 shadow-2xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">AI Resume Matchmaker</h1>
        <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Upload your resume and let our intelligent engine find the perfect job opportunities matching your unique skill set.
        </p>
        
        <form onSubmit={handleUpload} className="bg-white p-4 rounded-[2rem] md:rounded-full shadow-xl flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-full focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 hover:shadow-lg transition-all disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : "Scan Resume"}
          </button>
        </form>
        {error && <p className="text-red-300 mt-4 font-medium">{error}</p>}
      </div>

      {searched && (
        <div className="mt-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Extracted Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <span key={index} className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold capitalize border border-indigo-200 shadow-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 italic">No specific skills extracted, using generic keywords.</span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs ({jobs.length})</h2>
          </div>
          
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map(job => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 border border-gray-100 shadow-xl rounded-[2rem] text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No exact matches found</h3>
              <p className="text-gray-600">Consider updating your resume with clearer skill keywords.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiSearch;
