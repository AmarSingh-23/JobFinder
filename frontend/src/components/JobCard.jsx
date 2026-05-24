import React from 'react';
import { Link } from 'react-router-dom';

const timeAgo = (dateInput) => {
  const diff = Date.now() - new Date(dateInput).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
};

const JobCard = ({ job }) => {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-6 flex flex-col h-full hover:shadow-2xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-1 leading-tight">{job.title}</h3>
          <p className="text-gray-700 text-sm">{job.company}</p>
        </div>
        <span className="bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
          {job.jobType}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-600">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          {job.location}
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          ₹{job.salary?.toLocaleString('en-IN')}
        </div>
      </div>
      
      <div className="mb-4 flex-grow">
        <div className="flex flex-wrap gap-2 text-xs">
          {job.skillsRequired?.map((skill, index) => (
            <span key={index} className="text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full bg-gray-50">
              {skill}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mt-auto pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
        <div className="flex flex-col">
          <span className="text-gray-500 mb-1">
            {job.applicantsCount || 0} applicants
          </span>
          <span className="text-gray-400">
            {timeAgo(job.createdAt)}
          </span>
        </div>
        <Link 
          to={`/jobs/${job._id}`}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 hover:shadow-lg transition-all"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
