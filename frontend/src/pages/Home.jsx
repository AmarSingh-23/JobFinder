import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import usePageTitle from '../hooks/usePageTitle';

const Home = () => {
  usePageTitle('Browse Jobs');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    category: '',
    jobType: '',
    experienceLevel: '',
    minSalary: '',
    sort: ''
  });
  const [stats, setStats] = useState({ totalCompanies: 0, totalJobs: 0 });
  const [page, setPage] = useState(1);

  const fetchJobs = async (targetPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.location) params.append('location', filters.location);
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
      if (filters.category) params.append('category', filters.category);
      if (filters.minSalary) params.append('minSalary', filters.minSalary);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', targetPage);
      params.append('limit', 10);
      
      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(page);
  }, [page]);

  useEffect(() => {
    api.get('/users/stats').then(res => setStats(res.data)).catch(err => console.error(err));
  }, []); // Initial load

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(1);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchJobs(1);
  };

  return (
    <div className="py-8">
      {/* Hero Section */}
      <div className="bg-blue-800 rounded-[2rem] p-6 sm:p-10 md:p-16 text-center text-white mb-8 md:mb-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-700/50 to-blue-900/50 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">Find Your Calling</h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 md:mb-10 max-w-2xl mx-auto px-2">
            Discover thousands of job opportunities from <span className="font-semibold text-white bg-blue-700 px-3 py-1 rounded-full shadow-inner">{stats.totalCompanies > 0 ? `${stats.totalCompanies}+ top companies` : 'top companies'}</span> matching your skills and experience.
          </p>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white p-3 rounded-[2rem] md:rounded-full shadow-xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto border border-blue-100">
          <input 
            type="text" 
            placeholder="Job title, keywords, or company" 
            className="flex-1 px-5 py-3 border-none bg-transparent rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 w-full"
            value={filters.keyword}
            onChange={(e) => setFilters({...filters, keyword: e.target.value})}
          />
          <div className="hidden md:block w-[1px] bg-gray-200 my-2"></div>
          <input 
            type="text" 
            placeholder="City, state, or Remote" 
            className="flex-1 px-5 py-3 border-none bg-transparent rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 w-full"
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 hover:shadow-lg transition-all w-full md:w-auto mt-2 md:mt-0"
          >
            Search
          </button>
        </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Filters</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              >
                <option value="">All Locations</option>
                <option value="Remote">Remote</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi / NCR</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Pune">Pune</option>
                <option value="Kolkata">Kolkata</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Category</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                <option value="IT & Software">IT & Software</option>
                <option value="Marketing">Marketing</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                value={filters.jobType}
                onChange={(e) => setFilters({...filters, jobType: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                value={filters.experienceLevel}
                onChange={(e) => setFilters({...filters, experienceLevel: e.target.value})}
              >
                <option value="">Any Experience</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
                <option value="Executive">Executive</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                value={filters.sort}
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
              >
                <option value="">Latest (Default)</option>
                <option value="oldest">Oldest</option>
                <option value="salary">Highest Salary</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex justify-between">
                <span>Minimum Salary</span>
                <span className="text-blue-600 font-bold">₹{filters.minSalary ? Number(filters.minSalary).toLocaleString('en-IN') : '0'}</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="5000000" 
                step="100000"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={filters.minSalary || 0}
                onChange={(e) => setFilters({...filters, minSalary: e.target.value})}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                <span>₹0</span>
                <span>₹50L+</span>
              </div>
            </div>
            <button 
              onClick={handleApplyFilters}
              className="w-full bg-gray-900 text-white py-3 rounded-full font-semibold hover:bg-black hover:shadow-lg transition-all mt-2"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Job Listings */}
        <div className="w-full md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs</h2>
            <span className="text-gray-500 font-medium">{jobs.length} Results</span>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-500 font-medium">Loading jobs...</p>
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map(job => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
              
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600 font-semibold text-sm">
                  Page {page}
                </span>
                <button
                  disabled={jobs.length < 10}
                  onClick={() => setPage(prev => prev + 1)}
                  className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 border border-gray-100 shadow-xl rounded-[2rem] text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
