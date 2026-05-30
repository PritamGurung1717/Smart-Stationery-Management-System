/**
 * Resolves a product/donation image URL.
 * If it's already absolute (http/https), return as-is.
 * If it's a relative path like /uploads/..., use relative path for proxy.
 */
export const imgUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return url.startsWith("/") ? url : `/${url}`;
};
