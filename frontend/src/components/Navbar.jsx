import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
          Job Finder
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Jobs</Link>
          <Link to="/ai-search" className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors font-bold gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            AI Match
          </Link>
          {user ? (
            <>
              <div className="flex items-center space-x-4 mr-6">
                <div className="flex items-center bg-white px-4 py-1.5 border border-gray-100 rounded-full shadow-sm">
                  <div className="flex flex-col pr-1">
                    <span className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</span>
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${
                      user.role === 'admin' ? 'text-purple-700' : 
                      user.role === 'company' ? 'text-amber-700' : 'text-blue-700'
                    }`}>
                      {user.role === 'user' ? 'Job Seeker' : user.role === 'company' ? 'Recruiter' : 'Admin'}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                to={user.role === 'admin' ? '/dashboard/admin' : user.role === 'company' ? '/dashboard/company' : '/dashboard/user'}
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-full font-medium hover:bg-gray-200 hover:shadow-md transition-all ml-4"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-700 transition-colors font-medium px-4">Log in</Link>
              <Link to="/register" className="bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-800 hover:shadow-lg transition-all">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-blue-600 focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-4 shadow-xl absolute w-full">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-600 transition-colors font-medium">Jobs</Link>
          <Link to="/ai-search" onClick={() => setIsMenuOpen(false)} className="block text-indigo-600 hover:text-indigo-800 transition-colors font-bold flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            AI Match
          </Link>
          {user ? (
            <>
              <div className="flex items-center bg-white shadow-sm px-4 py-3 border border-gray-100 rounded-[2rem] mb-3">
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-gray-800 leading-tight">{user.name}</span>
                  <span className={`text-xs font-bold tracking-wider uppercase ${
                    user.role === 'admin' ? 'text-purple-700' : 
                    user.role === 'company' ? 'text-amber-700' : 'text-blue-700'
                  }`}>
                    {user.role === 'user' ? 'Job Seeker' : user.role === 'company' ? 'Recruiter' : 'Admin'}
                  </span>
                </div>
              </div>
              <Link
                onClick={() => setIsMenuOpen(false)}
                to={user.role === 'admin' ? '/dashboard/admin' : user.role === 'company' ? '/dashboard/company' : '/dashboard/user'}
                className="block text-gray-600 hover:text-blue-600 transition-colors font-medium py-1"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-center bg-gray-100 text-gray-800 px-4 py-3 rounded-full font-medium hover:bg-gray-200 hover:shadow-md transition-all mt-4"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 hover:text-blue-700 transition-colors font-medium pb-2 text-center">Log in</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block w-full text-center bg-blue-700 text-white px-5 py-3 rounded-full font-medium hover:bg-blue-800 hover:shadow-lg transition-all mt-2">
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
