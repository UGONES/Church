import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { authService } from '../services/apiService'; // Updated import
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import { useAuth } from '../hooks/useAuth';

const PasswordPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const alert = useAlert();
  const { user, isLoading: authLoading } = useAuth();
  
  // Determine mode from URL path
  const getModeFromPath = () => {
    const path = location.pathname;
    if (path === '/forgot-password') return 'request';
    if (path === '/reset-password') return 'reset';
    if (path === '/change-password') return 'change';
    return 'request';
  };

  const [mode, setMode] = useState(getModeFromPath());
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check URL parameters to determine mode
  useEffect(() => {
    document.title = "SMC: - Forgotten-Password | St. Micheal`s & All Angels Church | Ifite-Awka";
    const tokenParam = searchParams.get('token');
    if (tokenParam && mode === 'reset') {
      setToken(tokenParam);
      validateToken(tokenParam);
    }
  }, [searchParams, mode]);

  // If user is logged in and trying to access forgot password, redirect to change password
  useEffect(() => {
    if (user && mode === 'request' && !authLoading) {
      setMode('change');
    }
  }, [user, mode, authLoading]);

  const validateToken = async (token) => {
    try {
      setIsLoading(true);
      const response = await authService.validateResetToken(token);
      
      if (!response.valid) {
        alert.error('Invalid or expired reset link. Please request a new one.');
        setMode('request');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      alert.error('Invalid or expired reset link. Please request a new one.');
      setMode('request');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (mode === 'request') {
      if (!email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Email is invalid';
      }
    } else if (mode === 'reset' || mode === 'change') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (mode === 'change' && !currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPasswordStrength = (value) => {
    let strength = 0;
    
    // Length check
    if (value.length >= 8) strength += 25;
    if (value.length >= 12) strength += 25;
    
    // Complexity checks
    if (/[A-Z]/.test(value)) strength += 15;
    if (/[a-z]/.test(value)) strength += 15;
    if (/[0-9]/.test(value)) strength += 10;
    if (/[^A-Za-z0-9]/.test(value)) strength += 10;
    
    setPasswordStrength(Math.min(strength, 100));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    checkPasswordStrength(value);
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        alert.success('Password reset instructions sent to your email!');
        setMode('success');
      } else {
        alert.error(response.message || 'Failed to send reset instructions');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      
      // Don't reveal whether email exists in the system
      alert.success('If an account exists with this email, reset instructions have been sent.');
      setMode('success');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const response = await authService.resetPassword(token, password);
      
      if (response.success) {
        alert.success('Password reset successfully! You can now log in with your new password.');
        setMode('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        alert.error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.response?.status === 400) {
        alert.error('Invalid or expired reset token. Please request a new reset link.');
        setMode('request');
      } else {
        alert.error('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      const response = await authService.changePassword({
        currentPassword,
        newPassword: password,
        confirmPassword
      });
      
      if (response.success) {
        alert.success('Password changed successfully!');
        navigate('/profile');
      } else {
        alert.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert.error(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  if (authLoading || isLoading) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <Loader 
              type="spinner" 
              text={
                mode === 'request' 
                  ? "Sending reset instructions..." 
                  : mode === 'reset'
                  ? "Resetting your password..."
                  : "Changing your password..."
              } 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              {mode === 'success' ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-500 text-3xl"></i>
                </div>
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-lock text-blue-500 text-3xl"></i>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              {mode === 'request' && 'Reset Your Password'}
              {mode === 'reset' && 'Create New Password'}
              {mode === 'change' && 'Change Password'}
              {mode === 'success' && 'Check Your Email'}
            </h1>
            
            <p className="text-gray-600">
              {mode === 'request' && 'Enter your email to receive reset instructions'}
              {mode === 'reset' && 'Enter your new password below'}
              {mode === 'change' && 'Update your account password'}
              {mode === 'success' && 'We\'ve sent instructions to your email'}
            </p>
          </div>

          {/* Request Reset Form */}
          {mode === 'request' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors"
                >
                  Send Reset Instructions
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#FF7E45] hover:text-[#FFA76A] text-sm"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* Reset Password Form */}
          {(mode === 'reset' || mode === 'change') && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={mode === 'reset' ? handleResetPassword : handleChangePassword} className="space-y-4">
                {/* Current Password Field (only for change mode) */}
                {mode === 'change' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] ${
                        errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter current password"
                    />
                    {errors.currentPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {mode === 'change' ? 'New Password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={mode === 'change' ? "Enter new password" : "Enter your password"}
                  />
                  
                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getPasswordStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Strength: {getPasswordStrengthText()}
                      </p>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                  
                  <div className="text-xs text-gray-600 mt-1">
                    <p>• At least 8 characters</p>
                    <p>• Uppercase and lowercase letters</p>
                    <p>• At least one number</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm {mode === 'change' ? 'New Password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7E45] ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={mode === 'change' ? "Confirm new password" : "Confirm your password"}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors"
                >
                  {mode === 'reset' ? 'Reset Password' : 'Change Password'}
                </button>
              </form>

              {mode === 'change' && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/forgot-password')}
                    className="text-[#FF7E45] hover:text-[#FFA76A] text-sm"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {mode === 'success' && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="mb-4">
                <i className="fas fa-envelope text-4xl text-[#FF7E45] mb-3"></i>
                <h3 className="text-xl font-semibold mb-2">Check Your Email</h3>
                <p className="text-gray-600">
                  We've sent password reset instructions to your email address.
                  Please check your inbox and follow the link to reset your password.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  <i className="fas fa-info-circle mr-1"></i>
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setMode('request')}
                  className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors"
                >
                  Resend Instructions
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* Help section */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Need help? Contact support at{' '}
              <a href="mailto:support@church.org" className="text-[#FF7E45] hover:underline">
                support@church.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordPage;