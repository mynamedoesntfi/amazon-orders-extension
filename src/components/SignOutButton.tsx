import React, { useState, useEffect, useCallback } from "react";
import { signOutGoogleDrive, isLoggedInGoogleDrive } from "../utils/googleDrive";
import "./SignOutButton.css";

const SignOutButton: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check login status on mount and periodically to update button visibility
  useEffect(() => {
    checkLoginStatus();
    
    // Check login status every 2 seconds to update button visibility
    // This ensures the button appears after user logs in via export
    const interval = setInterval(checkLoginStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkLoginStatus = useCallback(async () => {
    try {
      const loggedIn = await isLoggedInGoogleDrive();
      setIsLoggedIn(loggedIn);
    } catch (err) {
      setIsLoggedIn(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      await signOutGoogleDrive();
      setIsLoggedIn(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign out from Google Drive."
      );
      // Still update login status to false on error
      setTimeout(() => setIsLoggedIn(false), 100);
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  // Only render button if logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <button
      type="button"
      className={`signout-button ${isSigningOut ? "signout-button--signing-out" : ""}`}
      onClick={handleSignOut}
      disabled={isSigningOut}
      title="Sign out from Google Drive"
    >
      {isSigningOut ? "Signing out..." : "Sign Out"}
    </button>
  );
};

export default SignOutButton;

