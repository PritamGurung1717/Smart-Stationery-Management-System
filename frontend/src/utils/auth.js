// frontend/src/utils/auth.js

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with Authorization token
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  
  // Validate token exists and is not a string literal "null" or "undefined"
  if (!token || token === "null" || token === "undefined") {
    console.warn("⚠️ No valid token found in localStorage");
    return {};
  }
  
  // Token should NOT have "Bearer " prefix in localStorage
  // We add it here for the Authorization header
  return { 
    Authorization: `Bearer ${token}` 
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  console.log("🔍 isAuthenticated check:", {
    hasToken: !!token,
    tokenValue: token?.substring(0, 30),
    tokenIsNull: token === "null",
    hasUser: !!user,
    userIsNull: user === "null"
  });
  
  const result = !!(
    token && 
    token !== "null" && 
    token !== "undefined" &&
    user &&
    user !== "null"
  );
  
  console.log("🔍 isAuthenticated result:", result);
  
  return result;
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "null") return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Set authentication data
 * @param {string} token - JWT token
 * @param {Object} user - User object
 */
export const setAuth = (token, user) => {
  // Sanitize token - remove "Bearer " prefix if present
  let cleanToken = token;
  if (token && /^Bearer\s+/i.test(token)) {
    cleanToken = token.replace(/^Bearer\s+/i, "").trim();
  }
  
  localStorage.setItem("token", cleanToken);
  localStorage.setItem("user", JSON.stringify(user));
};
