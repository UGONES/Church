import GoogleAuthButton from "../utils/googleAuth";
import FacebookAuthButton from "../utils/facebookAuth";
import { useSocialAuth } from "../contexts/SocialAuthContext";
import Loader from "./Loader";

const SocialLoginButtons = ({
  onSuccess,
  onError,
  loading: externalLoading,
}) => {
  const {
    isGoogleReady,
    isFacebookReady,
    loading: authLoading,
  } = useSocialAuth();

  const handleSocialSuccess = (userData) => {
    onSuccess(userData);
  };

  const handleSocialError = (error) => {
    onError(error);
  };

  if (authLoading || externalLoading) {
    return <Loader type="spinner" text="Initializing social login..." />;
  }

  return (
    <div className="social-login-buttons space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isGoogleReady && (
          <GoogleAuthButton
            onSuccess={handleSocialSuccess}
            onError={handleSocialError}
            text="Sign in with Google"
          />
        )}

        {isFacebookReady && (
          <FacebookAuthButton
            onSuccess={handleSocialSuccess}
            onError={handleSocialError}
            text="Sign in with Facebook"
          />
        )}
      </div>

      {(!isGoogleReady || !isFacebookReady) && (
        <div className="text-center text-sm text-gray-500">
          <p>Some social login options may be temporarily unavailable.</p>
        </div>
      )}
    </div>
  );
};

export default SocialLoginButtons;
