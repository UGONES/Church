import { useState } from 'react';
import { socialAuthService, authService } from '../services/apiService';

export const FacebookAuthButton = ({ onSuccess, onError, text = "Continue with Facebook" }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      socialAuthService.facebookLogin();
    } catch (error) {
      onError('Failed to initiate Facebook login');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="flex items-center justify-center bg-[#1877F2] text-white px-4 py-3 rounded-md hover:bg-[#166FE5] transition-colors w-full disabled:opacity-50"
    >
      {isLoading ? (
        <span>Loading...</span>
      ) : (
        <>
          <i className="fab fa-facebook-f mr-2"></i>
          {text}
        </>
      )}
    </button>
  );
};

export const handleFacebookLogin = async (accessToken) => {
  try {
    const response = await authService.socialLogin('facebook', accessToken);
    return response;
  } catch (error) {
    console.error('Facebook login error:', error);
    throw error;
  }
};

export const initFacebookSDK = (appId) => {
  return new Promise((resolve) => {
    if (window.FB) {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve(true);
    } else {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        resolve(true);
      };

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
  });
};

// Alternative: Custom Facebook login implementation
export const customFacebookLogin = () => {
  return new Promise((resolve, reject) => {
    window.FB.login(function(response) {
      if (response.authResponse) {
        resolve(response.authResponse.accessToken);
      } else {
        reject(new Error('User cancelled login or did not fully authorize.'));
      }
    }, { scope: 'email,public_profile' });
  });
};

export default FacebookAuthButton;