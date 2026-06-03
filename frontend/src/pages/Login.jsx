import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [activeTab, setActiveTab] = useState('user'); // user, company, admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('login'); // login, forgotPassword, resetPassword
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendTrigger, setResendTrigger] = useState(0);

  const { login, verifyOtp, resendOtp } = useContext(AuthContext);
  const { showToast } = useToast();

  useEffect(() => {
    if (view === 'verifyOtp') {
      setResendTimer(60);
      setCanResend(false);
      const interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [view, resendTrigger]);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('@gmail.com') && activeTab !== 'admin') {
      // Typically admins don't strictly need gmail, but let's encourage it or relax it
      setError('Please enter a valid Gmail address (@gmail.com)');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(email, password, activeTab);
      showToast('Welcome back! Login successful', 'success');
      // Route based on role
      if (data.user.role === 'company') {
        navigate('/dashboard/company');
      } else if (data.user.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/user');
      }
    } catch (err) {
      if (err.response?.data?.needsVerification) {
        setError('');
        showToast('Your email is not verified. A new 6-digit OTP has been sent to your email.', 'warning');
        // Change view to verify OTP
        setView('verifyOtp');
      } else {
        showToast('Invalid email or password', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await resendOtp(email);
      showToast(res.message || 'OTP resent successfully', 'success');
      setResendTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await verifyOtp(email, otp);
      showToast('Email verified! You can now log in.', 'success');
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email, role: activeTab });
      showToast('OTP sent to your email. Check your inbox (or console for dev).', 'info');
      setView('resetPassword');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      showToast('Password reset successful! You can now login.', 'success');
      setTimeout(() => {
        setView('login');
        setPassword('');
        setOtp('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md transform transition-all hover:shadow-2xl">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
          {view === 'login' ? 'Welcome back' : 'Reset Password'}
        </h2>
        <p className="text-gray-500 mb-8 text-center">
          {view === 'login' ? 'Select your role and login to your account.' : 'Follow the steps to recover your access.'}
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-full mb-6 text-sm font-medium">{error}</div>}

        {view === 'login' && (
          <>
            {/* Role Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-[2rem]">
              {['user', 'company'].map((role) => (
                <button
                  key={role}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-bold capitalize transition-all duration-200 cursor-pointer ${activeTab === role ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  onClick={() => {
                    setActiveTab(role);
                    setError('');
                  }}
                >
                  {role}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-xs font-normal text-gray-400">(Gmail required)</span></label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="you@gmail.com"
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
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setView('forgotPassword'); setError(''); setMessage(''); }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition-all mt-6 shadow-md ${isSubmitting ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
              >
                {isSubmitting ? 'Logging in...' : `Log In as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              </button>
            </form>
          </>
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
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            <div className="flex justify-between items-center mt-2 mb-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend}
                className={`text-sm font-semibold ${canResend ? 'text-blue-600 cursor-pointer hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
              >
                {canResend ? 'Resend OTP' : `Resend OTP in ${resendTimer}s`}
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

        {view === 'forgotPassword' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Account Role</label>
              <select
                className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium capitalize cursor-pointer"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="user">User</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition-all mt-4 ${isSubmitting ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            >
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-full font-bold hover:bg-gray-200 transition-all mt-2"
            >
              Back to Login
            </button>
          </form>
        )}

        {view === 'resetPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Enter OTP</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold tracking-widest text-center"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium pr-10"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
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
              className={`w-full bg-green-600 text-white py-3 rounded-full font-bold hover:bg-green-700 transition-all mt-4 ${isSubmitting ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
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
            Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Sign up</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
