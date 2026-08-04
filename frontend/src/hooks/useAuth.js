// frontend/src/hooks/useAuth.js
import { useAuthStore } from "../context/AuthContext.jsx";

/**
 * Custom hook for authentication state and functions
 * Provides easy access to auth state and actions from any component
 */
export const useAuth = () => {
  const {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    fetchProfile,
    hasRole,
    isAdmin,
    isManager,
    isBuyer,
    getRole,
    getDisplayName,
    clearError,
    reset,
  } = useAuthStore();

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user && !!profile;

  /**
   * Check if user has a specific role or higher
   * For example: hasRoleOrHigher('manager') returns true for admin and manager
   */
  const hasRoleOrHigher = (role) => {
    const roles = ["buyer", "manager", "admin"];
    const userRoleIndex = roles.indexOf(getRole());
    const requiredRoleIndex = roles.indexOf(role);

    if (userRoleIndex === -1 || requiredRoleIndex === -1) return false;
    return userRoleIndex >= requiredRoleIndex;
  };

  /**
   * Get user's full name or fallback
   */
  const getUserName = () => {
    return getDisplayName();
  };

  /**
   * Get user's email
   */
  const getUserEmail = () => {
    return user?.email || null;
  };

  /**
   * Get user's phone
   */
  const getUserPhone = () => {
    return profile?.phone || null;
  };

  /**
   * Check if user profile is complete
   */
  const isProfileComplete = () => {
    if (!profile) return false;
    return !!(profile.full_name && profile.phone && profile.role);
  };

  /**
   * Get user initials for avatar
   */
  const getUserInitials = () => {
    const name = getUserName();
    if (!name) return "U";

    const parts = name.split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return {
    // State
    user,
    profile,
    loading,
    error,
    isAuthenticated,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    fetchProfile,
    clearError,
    reset,

    // Role checks
    hasRole,
    hasRoleOrHigher,
    isAdmin,
    isManager,
    isBuyer,
    getRole,

    // User info
    getUserName,
    getUserEmail,
    getUserPhone,
    getDisplayName,
    getUserInitials,

    // Profile status
    isProfileComplete,
  };
};

export default useAuth;
