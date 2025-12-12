import React, { createContext, useContext, useState, useEffect } from "react";
import { initGoogleAuth, initFacebookAuth } from "../utils/authUtils";

const SocialAuthContext = createContext();

export const useSocialAuth = () => {
  const context = useContext(SocialAuthContext);
  if (!context) {
    throw new Error("useSocialAuth must be used within a SocialAuthProvider");
  }
  return context;
};

export const SocialAuthProvider = ({ children }) => {
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isFacebookReady, setIsFacebookReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Check if environment variables are set
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

        if (!googleClientId && !facebookAppId) {
          console.warn("No social auth environment variables found");
          setLoading(false);
          return;
        }

        // Initialize providers that have environment variables
        const promises = [];

        if (googleClientId) {
          promises.push(initGoogleAuth(googleClientId));
        } else {
          setIsGoogleReady(false);
        }

        if (facebookAppId) {
          promises.push(initFacebookAuth(facebookAppId));
        } else {
          setIsFacebookReady(false);
        }

        const results = await Promise.allSettled(promises);

        if (googleClientId) {
          setIsGoogleReady(
            results[0].status === "fulfilled" && results[0].value,
          );
        }

        if (facebookAppId) {
          setIsFacebookReady(
            results[facebookAppId ? 1 : 0].status === "fulfilled" &&
              results[facebookAppId ? 1 : 0].value,
          );
        }
      } catch (error) {
        console.error("Failed to initialize social auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    isGoogleReady,
    isFacebookReady,
    loading,
  };

  return (
    <SocialAuthContext.Provider value={value}>
      {children}
    </SocialAuthContext.Provider>
  );
};

export default SocialAuthContext;
