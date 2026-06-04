import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import usePageTitle from '../hooks/usePageTitle';

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'text-gray-400', barColor: 'bg-gray-200', width: 'w-0' };
  
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9\W]/.test(password)) score += 1;
  
  if (password.length < 8) {
    return { score: 1, label: 'Too Short', color: 'text-red-500', barColor: 'bg-red-500', width: 'w-1/4' };
  }

  switch (score) {
    case 1:
      return { score: 1, label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500', width: 'w-1/4' };
    case 2:
      return { score: 2, label: 'Fair', color: 'text-orange-500', barColor: 'bg-orange-500', width: 'w-2/4' };
    case 3:
      return { score: 3, label: 'Good', color: 'text-yellow-500', barColor: 'bg-yellow-500', width: 'w-3/4' };
    case 4:
      return { score: 4, label: 'Strong', color: 'text-green-500', barColor: 'bg-green-500', width: 'w-full' };
    default:
      return { score: 0, label: '', color: 'text-gray-400', barColor: 'bg-gray-200', width: 'w-0' };
  }
};

const Register = () => {
  usePageTitle('Create Account');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'user'
  });
  const [step, setStep] = useState(1); // 1: Info, 2: OTP (if user)
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendTrigger, setResendTrigger] = useState(0);
  const { register, verifyOtp, resendOtp } = useContext(AuthContext);
  const { showToast } = useToast();

  useEffect(() => {
    if (step === 2 || step === 'otp') {
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
  }, [step, resendTrigger]);
  const navigate = useNavigate();
  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      setError('Please use a valid Gmail address (@gmail.com)');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      if (formData.role === 'user' || formData.role === 'admin') {
        showToast('OTP sent to your email! Check your inbox', 'success');
        setStep(2); // Go to OTP step
      } else if (formData.role === 'company') {
        showToast('Account created successfully! Welcome', 'success');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await resendOtp(formData.email);
      showToast(res.message || 'OTP resent successfully', 'success');
      setResendTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await verifyOtp(formData.email, otp);
      showToast('Account created successfully! Welcome', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      showToast('Invalid OTP. Please try again.', 'error');
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md transform transition-all hover:shadow-2xl">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">Create an account</h2>
        <p className="text-gray-500 mb-8 text-center">Join thousands of others today.</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-full mb-6 text-sm font-medium">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {formData.role === 'company' ? 'Company Name' : 'Full Name'}
              </label>
              <input type="text" name="name" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={formData.role === 'company' ? 'Google' : 'Amar Singh'} value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gmail Address</label>
              <input type="email" name="email" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@gmail.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1 px-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-gray-500">Password Strength:</span>
                    <span className={strength.color}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.barColor} ${strength.width}`}></div>
                  </div>
                </div>
              )}
            </div>
            <div>

              <div className="flex space-x-2 mt-2">
                {['user', 'company'].map((roleType) => (
                  <label key={roleType} className="flex-1 cursor-pointer">
                    <input type="radio" name="role" value={roleType} checked={formData.role === roleType} onChange={handleChange} className="sr-only" />
                    <div className={`text-center py-2 rounded-full border-2 font-medium capitalize text-sm transition-all ${formData.role === roleType ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-600 hover:bg-gray-50'}`}>
                      {roleType}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white py-3 rounded-full font-bold hover:bg-blue-700 transition-all mt-4 ${isSubmitting ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Enter OTP sent to your email</label>
              <input type="text" className="w-full px-4 py-3 rounded-full border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-xl font-bold" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} required />
              <p className="text-xs text-gray-500 mt-2">Check your server console for the OTP since email sending is mocked locally.</p>
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
              {isSubmitting ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
