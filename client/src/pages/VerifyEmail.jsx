import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../utils/api';
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const alert = useAlert();
  const hasVerified = useRef(false); // Prevent duplicate verification

  const [status, setStatus] = useState('verifying');
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    document.title = "SMC: - Verify-Email | St. Micheal`s & All Angels Church | Ifite-Awka";

    // Get email from localStorage
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
    
    if (!token) {
      setStatus('error');
      setIsLoading(false);
      alert.error('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    console.log('Token from URL params:', token);
    
    // Prevent duplicate verification
    if (!hasVerified.current) {
      hasVerified.current = true;
      verifyEmailToken();
    }
  }, [token, alert]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      localStorage.removeItem('pendingVerificationEmail');
      navigate('/login', {
        state: { message: 'Email verified successfully! You can now log in.' }
      });
    }
  }, [status, countdown, navigate]);

  const verifyEmailToken = async () => {
    try {
      setIsLoading(true);
      console.log('Verifying token:', token);

      const response = await apiClient.get(`/auth/verify-email/${token}`);
      console.log('Full verification response:', response);

      // FIX: Handle both response structures
      const success = response?.data?.success || response?.success;
      const message = response?.data?.message || response?.message;

      if (success) {
        setStatus('success');
        alert.success('Email verified successfully! You can now log in to your account.');
        localStorage.removeItem('pendingVerificationEmail');
      } else {
        setStatus('error');
        alert.error(message || 'Email verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      
      // FIX: Correct error response structure - handle both formats
      const errorData = error.response?.data || error.response;
      const errorMessage = errorData?.message || error.message;

      if (error.response?.status === 400) {
        if (errorMessage?.includes('expired') || errorMessage?.includes('Expired')) {
          setStatus('expired');
          alert.info('Your verification link has expired. Please request a new one.');
        } else if (errorMessage?.includes('invalid') || errorMessage?.includes('Invalid')) {
          setStatus('error');
          alert.error('Invalid verification token. Please check your email for the correct link.');
        } else {
          setStatus('error');
          alert.error(errorMessage || 'Verification failed. Please try again.');
        }
      } else if (error.response?.status === 404) {
        setStatus('error');
        alert.error('Verification link not found. Please request a new verification email.');
      } else if (error.response?.status === 429) {
        setStatus('error');
        alert.error('Verification already in progress. Please wait a moment.');
      } else if (error.response?.status === 500) {
        setStatus('error');
        alert.error('Server error during verification. Please try again later.');
      } else {
        setStatus('error');
        alert.error('Email verification failed. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      if (!userEmail) {
        alert.error('Email address is required to resend verification.');
        return;
      }

      const response = await apiClient.post('/auth/resend-verification', { email: userEmail });
      
      // FIX: Handle both response structures
      const success = response?.data?.success || response?.success;
      const message = response?.data?.message || response?.message;

      if (success) {
        alert.success('Verification email sent! Please check your inbox.');
      } else {
        alert.error(message || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      
      // FIX: Correct error response structure
      const errorData = error.response?.data || error.response;
      const errorMsg = errorData?.message || 'Failed to send verification email. Please try again later.';
      
      alert.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    localStorage.removeItem('pendingVerificationEmail');
    navigate('/login', {
      state: { message: 'Email verification completed' }
    });
  };

  const handleGoToHome = () => {
    localStorage.removeItem('pendingVerificationEmail');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <Loader type="spinner" text="Verifying your email..." />
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
              {status === 'success' ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-500 text-3xl"></i>
                </div>
              ) : status === 'error' ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-times text-red-500 text-3xl"></i>
                </div>
              ) : status === 'expired' ? (
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-500 text-3xl"></i>
                </div>
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-envelope text-blue-500 text-3xl"></i>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'expired' && 'Link Expired'}
            </h1>

            <p className="text-gray-600">
              {status === 'success' && 'Your email has been successfully verified.'}
              {status === 'error' && 'We couldn\'t verify your email address.'}
              {status === 'expired' && 'Your verification link has expired.'}
            </p>
          </div>

          {/* Content based on status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {status === 'success' && (
              <div className="text-center">
                <p className="mb-6">
                  Thank you for verifying your email address. You will be redirected to the login page in {countdown} seconds.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleGoToLogin}
                    className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors"
                  >
                    Go to Login Now
                  </button>
                  <button
                    onClick={handleGoToHome}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}

            {(status === 'error' || status === 'expired') && (
              <div className="text-center">
                <p className="mb-6">
                  {status === 'error'
                    ? 'There was a problem verifying your email address. This could be due to an invalid or malformed verification link.'
                    : 'Your verification link has expired. Verification links are valid for 24 hours. Please request a new verification email.'
                  }
                </p>
                <div className="space-y-3">
                  {userEmail && (
                    <button
                      onClick={resendVerificationEmail}
                      disabled={isLoading}
                      className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md hover:bg-[#FFA76A] transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  )}
                  <button
                    onClick={handleGoToLogin}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={handleGoToHome}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help section */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Need help? Contact our support team at <a href="mailto:support@church.org" className="text-[#FF7E45] hover:underline">support@church.org</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;