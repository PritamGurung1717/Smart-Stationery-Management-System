import { API_BASE_URL } from "./api.js";

/**
 * Resolves a product/donation image URL.
 * If it's already absolute (http/https), return as-is.
 * If it's a relative path, prepend the backend API_BASE_URL.
 */
export const imgUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
};
