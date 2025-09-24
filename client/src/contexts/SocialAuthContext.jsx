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

        // Initialize both providers in parallel
        const [googleReady, facebookReady] = await Promise.allSettled([
          initGoogleAuth(import.meta.env.VITE_GOOGLE_CLIENT_ID),
          initFacebookAuth(import.meta.env.VITE_FACEBOOK_APP_ID),
        ]);

        setIsGoogleReady(
          googleReady.status === "fulfilled" && googleReady.value,
        );
        setIsFacebookReady(
          facebookReady.status === "fulfilled" && facebookReady.value,
        );
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
