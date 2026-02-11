/**
 * Security utility to map internal error messages to safe user-facing messages.
 * Prevents information leakage about database structure, auth mechanisms, etc.
 */
export const getSafeErrorMessage = (error: unknown): string => {
  const message = (error as { message?: string })?.message || "";

  // Database constraint errors - hide schema details
  if (message.includes("constraint") || message.includes("violates")) {
    return "Invalid input. Please check your data and try again.";
  }

  // RLS policy failures - hide policy details
  if (message.includes("row-level security") || message.includes("policy")) {
    return "You don't have permission to perform this action.";
  }

  // Authentication errors - generic messages to prevent user enumeration
  if (message.includes("Invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (message.includes("User already registered") || message.includes("already exists")) {
    return "This email is already registered.";
  }

  if (message.includes("Email not confirmed")) {
    return "Please verify your email address.";
  }

  if (message.includes("Password") && message.includes("weak")) {
    return "Please use a stronger password.";
  }

  // Session/token errors
  if (message.includes("JWT") || message.includes("token") || message.includes("expired")) {
    return "Session expired. Please sign in again.";
  }

  // Network errors
  if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  // Rate limiting
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait and try again.";
  }

  // Log the actual error for debugging (only in development)
  // Works in both Vite (import.meta.env.DEV) and React Native (__DEV__)
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  if (isDev) {
    console.error("Unhandled error:", error);
  }

  // Generic fallback - never expose raw error messages
  return "An error occurred. Please try again.";
};
