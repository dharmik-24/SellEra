// Helper functions for handling both old Buffer images and new Cloudinary images

/**
 * Get the primary image URL for a product
 * @param {Object} product - Product object
 * @returns {String} - Image URL or data URL
 */
export const getProductImageUrl = (product) => {
  // Check for new Cloudinary images first
  if (product.images && product.images.length > 0) {
    return product.images[0].url;
  }
  
  // Fallback to old Buffer image format
  if (product.image && product.image.data) {
    return `data:${product.image.contentType};base64,${product.image.data.toString('base64')}`;
  }
  
  // Return default placeholder
  return '/images/default.jpg';
};

/**
 * Get all image URLs for a product
 * @param {Object} product - Product object
 * @returns {Array} - Array of image URLs
 */
export const getProductImageUrls = (product) => {
  const images = [];
  
  // Add new Cloudinary images
  if (product.images && product.images.length > 0) {
    images.push(...product.images.map(img => img.url));
  }
  
  // Add old Buffer image if no Cloudinary images exist
  if (images.length === 0 && product.image && product.image.data) {
    images.push(`data:${product.image.contentType};base64,${product.image.data.toString('base64')}`);
  }
  
  // Return default if no images
  if (images.length === 0) {
    images.push('/images/default.jpg');
  }
  
  return images;
};

/**
 * Get profile image URL for user or vendor
 * @param {Object} user - User or Vendor object
 * @returns {String} - Image URL or data URL
 */
export const getProfileImageUrl = (user) => {
  // Check for new Cloudinary profile image first
  if (user.profileImage && user.profileImage.url) {
    return user.profileImage.url;
  }
  
  // Fallback to old Buffer image format
  if (user.image && user.image.data) {
    return `data:${user.image.contentType};base64,${user.image.data.toString('base64')}`;
  }
  
  // Return default placeholder
  return '/images/default.jpg';
};

/**
 * Get optimized image URL with transformations
 * @param {String} imageUrl - Cloudinary image URL
 * @param {Object} options - Transformation options
 * @returns {String} - Optimized image URL
 */
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  // Only apply transformations to Cloudinary URLs
  if (!imageUrl.includes('cloudinary.com')) {
    return imageUrl;
  }
  
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  };
  
  // Simple URL transformation (for more complex transformations, use Cloudinary SDK)
  let optimizedUrl = imageUrl;
  
  if (defaultOptions.width || defaultOptions.height) {
    const transformations = [];
    if (defaultOptions.width) transformations.push(`w_${defaultOptions.width}`);
    if (defaultOptions.height) transformations.push(`h_${defaultOptions.height}`);
    if (defaultOptions.crop) transformations.push(`c_${defaultOptions.crop}`);
    
    optimizedUrl = imageUrl.replace('/upload/', `/upload/${transformations.join(',')}/`);
  }
  
  return optimizedUrl;
};

/**
 * Check if an image is a Cloudinary image
 * @param {String} imageUrl - Image URL
 * @returns {Boolean} - True if Cloudinary image
 */
export const isCloudinaryImage = (imageUrl) => {
  return imageUrl && imageUrl.includes('cloudinary.com');
};

/**
 * Extract public ID from Cloudinary URL
 * @param {String} imageUrl - Cloudinary image URL
 * @returns {String} - Public ID
 */
export const extractPublicId = (imageUrl) => {
  if (!isCloudinaryImage(imageUrl)) {
    return null;
  }
  
  const parts = imageUrl.split('/');
  const uploadIndex = parts.findIndex(part => part === 'upload');
  
  if (uploadIndex === -1) {
    return null;
  }
  
  // Get everything after /upload/ and before file extension
  const pathAfterUpload = parts.slice(uploadIndex + 1).join('/');
  const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // Remove file extension
  
  return publicId;
};
