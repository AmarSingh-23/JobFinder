import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [view, setView] = useState('login'); // login, verifyOtp
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, verifyOtp, resendOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const data = await login(email, password, 'admin');
      if (data.user.role === 'admin') {
        navigate('/dashboard/admin');
      }
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        setError('');
        setMessage('Your email is not verified. A new 6-digit OTP has been sent to your email.');
        // Change view to verify OTP
        setView('verifyOtp');
      } else {
        setError(err.response?.data?.message || 'Failed to login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await resendOtp(email);
      setMessage(res.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await verifyOtp(email, otp);
      setMessage('Email verified! You can now log in.');
      setTimeout(() => {
        setView('login');
        setOtp('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md transform transition-all hover:shadow-2xl">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
          Admin Panel
        </h2>
        <p className="text-gray-500 mb-8 text-center">
          Authorized personnel only.
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-full mb-6 text-sm font-medium">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 p-3 rounded-full mb-6 text-sm font-medium">{message}</div>}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition-all mt-6 shadow-md ${isSubmitting ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In to Admin Dashboard'}
            </button>
          </form>
        )}

        {view === 'verifyOtp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Enter 6-digit OTP</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold tracking-widest text-center"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-between items-center mt-2 mb-2">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                Resend OTP
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-green-600 text-white py-3 rounded-full font-bold hover:bg-green-700 transition-all ${isSubmitting ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Log in'}
            </button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-full font-bold hover:bg-gray-200 transition-all mt-2"
            >
              Cancel
            </button>
          </form>
        )}

        {view === 'login' && (
          <div className="mt-6 text-center text-sm text-gray-600 font-medium">
            No admin account? <button onClick={() => navigate('/admin-register')} className="text-blue-600 font-bold hover:underline">Apply here</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
