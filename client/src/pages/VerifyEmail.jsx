// pages/VerifyEmail.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/apiService';
import Loader from '../components/Loader';
import { useAlert } from '../utils/Alert';
import useAuth from '../hooks/useAuth';

const VerifyEmail = () => {
  const { user, refreshUser } = useAuth();
  const { token } = useParams(); // ✅ properly destructure token
  const navigate = useNavigate();
  const alert = useAlert();
  const hasVerified = useRef(false);

  const [status, setStatus] = useState('waiting');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    document.title = "SMC: Verify Email | St. Micheal`s & All Angels Church | Ifite-Awka";

    // preload email for resend
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    const currentUserEmail = user?.email;
    if (storedEmail || currentUserEmail) {
      setUserEmail(storedEmail || currentUserEmail || '');
    }

    // if no token, remain in "waiting" state
    if (!token) {
      setStatus('waiting');
      setIsLoading(false);
      return;
    }

    // token exists → start verifying
    if (!hasVerified.current) {
      hasVerified.current = true;
      verifyEmailToken(token);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      localStorage.removeItem('pendingVerificationEmail');
      handleRedirect({
        state: { message: 'Email verified successfully! You can now log in.' },
      });
    }
  }, [status, countdown]);

  const verifyEmailToken = async (jwtToken) => {
    try {
      setIsLoading(true);
      setStatus('pending');
      console.log('🔑 Verifying token:', jwtToken);

      const response = await authService.verifyEmail(jwtToken);
      console.log('✅ Verification response:', response);

      const success = response?.data?.success ?? response?.success;
      const message = response?.data?.message ?? response?.message;

      if (success) {
        setStatus('success');
        alert.success('Email verified successfully! You can now log in.');
        localStorage.removeItem('pendingVerificationEmail');
      } else {
        setStatus('error');
        alert.error(message || 'Email verification failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Email verification error:', error);

      const errorData = error.response?.data || error.response;
      const errorMessage = errorData?.message || error.message;

      if (error.response?.status === 400) {
        if (/expired/i.test(errorMessage)) {
          setStatus('expired');
          alert.info('Your verification link has expired. Please request a new one.');
        } else if (/invalid/i.test(errorMessage)) {
          setStatus('error');
          alert.error('Invalid verification token. Please check your email for the correct link.');
        } else {
          setStatus('error');
          alert.error(errorMessage || 'Verification failed. Please try again.');
        }
      } else if (error.response?.status === 404) {
        setStatus('error');
        alert.error('Verification link not found. Please request a new verification email.');
      } else {
        setStatus('error');
        alert.error('Email verification failed. Please try again later.');
      }

      if (user) {
        await refreshUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      setIsLoading(true);
      const Email =   email || user?.email || localStorage.getItem("pendingVerificationEmail");


      if (!Email) {
        alert.error('Email address is required to resend verification.');
        return;
      }

      const response = await authService.resendVerification(Email);
      const success = response?.data?.success ?? response?.success;
      const message = response?.data?.message ?? response?.message;

      if (success) {
        alert.success('Verification email sent! Please check your inbox.');
        handleGoToLogin();
        localStorage.removeItem('pendingVerificationEmail');
      } else {
        alert.error(message || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      const errorData = error.response?.data || error.response;
      const errorMsg = errorData?.message || 'Failed to send verification email.';
      alert.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirect = (options = {}) => {
    localStorage.removeItem('pendingVerificationEmail');
    if (user) {
      navigate(
        user.role === 'admin' || user.role === 'moderator'
          ? `/admin/${user.id}/dashboard`
          : `/user/${user.id}/dashboard`,
        options
      );
    } else {
      navigate('/login', options);
    }
  };

  const handleGoToLogin = () => {
    localStorage.removeItem('pendingVerificationEmail');
    navigate('/login', { state: { message: 'Email verification completed' } });
  };

  const handleGoToHome = () => {
    localStorage.removeItem('pendingVerificationEmail');
    navigate('/');
  };

  if (isLoading || status === 'pending') {
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
              {status === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-500 text-3xl"></i>
                </div>
              )}
              {status === 'error' && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-times text-red-500 text-3xl"></i>
                </div>
              )}
              {status === 'expired' && (
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-500 text-3xl"></i>
                </div>
              )}
              {status === 'waiting' && (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-envelope text-blue-500 text-3xl"></i>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {status === 'waiting' && 'Awaiting Verification'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'expired' && 'Link Expired'}
            </h1>

            <p className="text-gray-600">
              {status === 'waiting' && 'Check your inbox for a verification link.'}
              {status === 'success' && 'Your email has been successfully verified.'}
              {status === 'error' && 'We couldn\'t verify your email address.'}
              {status === 'expired' && 'Your verification link has expired.'}
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {status === 'success' && (
              <div className="text-center">
                <p className="mb-6">
                  Thank you for verifying your email.
                  {countdown > 0 ? ` Redirecting in ${countdown}s...` : ' Redirecting...'}
                </p>
                <div className="space-y-3">
                  <button onClick={handleRedirect} className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md">
                    Continue Now
                  </button>
                  <button onClick={handleGoToHome} className="w-full border border-gray-300 py-2 px-4 rounded-md">
                    Go to Homepage
                  </button>
                  <a
                    href="https://mail.google.com/mail"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full border border-gray-300 py-2 px-4 rounded-md text-center"
                  >
                    Open Gmail
                  </a>
                </div>
              </div>
            )}

            {status === 'expired' && (
              <div className="text-center">
                <p className="mb-6">
                  Your verification link has expired. Verification links are valid for 24 hours.
                  We will resend a new verification email to:
                </p>

                <div className="space-y-3">
                  {/* Show the email we’ll resend to */}
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className="mt-1 w-full px-4 py-3 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />

                  <button
                    onClick={() => resendVerificationEmail(userEmail)}
                    disabled={isLoading}
                    className="w-full bg-[#FF7E45] text-white py-2 px-4 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Resend Verification Email'}
                  </button>

                  <button
                    onClick={handleGoToLogin}
                    className="w-full border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <p className="mb-6">
                  There was a problem verifying your email address. This may be due to an invalid or malformed verification link.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleGoToLogin}
                    className="w-full border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}

            {status === 'waiting' && (
              <div className="text-center">
                <p className="mb-6">We are waiting for you to verify your email. Please check your inbox.</p>
                <div className="space-y-3">
                  <button onClick={handleGoToLogin} className="w-full bg-[#FF7E45] text-white px-4 py-2 rounded-md">
                    Go to Login
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Need help? Contact our support team at{' '}
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

export default VerifyEmail;
