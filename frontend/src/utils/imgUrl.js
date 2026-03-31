/**
 * Resolves a product/donation image URL.
 * If it's already absolute (http/https), return as-is.
 * If it's a relative path like /uploads/..., prepend the backend base.
 */
const BASE = "http://localhost:5000";

export const imgUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};
