/**
 * Utility to resolve image paths.
 * Ensures paths are absolute (starting with '/') and handles known missing images.
 */
export const resolveImagePath = (path) => {
  if (!path) return '/assets/images/shoes-1.png'; // Default fallback

  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  // Add leading slash if missing
  let fullPath = path.startsWith('/') ? path : '/' + path;

  // Known missing images fallback
  if (fullPath.includes('shoes-6.png')) {
    // Fallback to shoes-5.png or another available image
    return '/assets/images/shoes-5.png';
  }

  return fullPath;
};
