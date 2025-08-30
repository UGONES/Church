import { ShareButton as LoginButton } from 'react-facebook';
import { apiClient } from './api';
import { authService } from '../constants/apiService';

export const FacebookAuthButton = ({ onSuccess, onError, text = "Continue with Facebook" }) => {
  const handleSuccess = async (response) => {
    try {
      // Send the access token to your backend
      const authResponse = await apiClient.post('/auth/facebook', {
        accessToken: response.tokenDetail.accessToken
      });

      if (authResponse.success) {
        onSuccess(authResponse.data);
      } else {
        onError(authResponse.message || 'Facebook authentication failed');
      }
    } catch (error) {
      console.error('Facebook authentication error:', error);
      onError('Failed to authenticate with Facebook');
    }
  };

  const handleError = (error) => {
    console.error('Facebook auth error:', error);
    onError('Facebook authentication failed');
  };

  return (
    <LoginButton 
      scope="email,public_profile"
      onCompleted={handleSuccess}
      onError={handleError}
      className="facebook-login-button"
    >
      <div className="flex items-center justify-center bg-[#1877F2] text-white px-4 py-3 rounded-md hover:bg-[#166FE5] transition-colors w-full">
        <i className="fab fa-facebook-f mr-2"></i>
        {text}
      </div>
    </LoginButton>
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

export const initFacebookAuth = (appId) => {
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
      // Load Facebook SDK dynamically
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