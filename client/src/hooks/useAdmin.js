import { useEffect, useState } from "react";
import { isAdmin, getAdminSessionTime, isAuthenticated } from "../utils/auth";

export const useAdmin = () => {
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [adminStatus, setAdminStatus] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = isAdmin();
      const remainingTime = getAdminSessionTime();
      const confirmAdminStatus = isAuthenticated();
      setIsUserAdmin(adminStatus);
      setSessionTime(remainingTime);
      setAdminStatus(confirmAdminStatus);
    };

    checkAdminStatus();

    // Update session time every minute
    const interval = setInterval(checkAdminStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return { isAdmin: isUserAdmin, sessionTime, adminStatus };
};
