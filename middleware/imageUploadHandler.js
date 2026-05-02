import multer from 'multer';
import AppError from '../utility/AppError.js';

/**
 * Error handler for image upload middleware
 */
export const handleImageUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum size allowed is 5MB per image.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 5 images allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field. Please check your form.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the form.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in the form.';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }
    
    return next(new AppError(message, 400));
  }
  
  // Handle Cloudinary errors
  if (error.message && error.message.includes('cloudinary')) {
    return next(new AppError('Image upload service error. Please try again.', 500));
  }
  
  // Handle file type errors
  if (error.message && error.message.includes('Only image files are allowed')) {
    return next(new AppError('Only image files are allowed. Please upload PNG, JPG, or WEBP files.', 400));
  }
  
  next(error);
};

/**
 * Validate uploaded images
 */
export const validateImages = (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.files && !req.file) {
      return next();
    }
    
    const files = req.files || [req.file];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        return next(new AppError(`File ${file.originalname} is too large. Maximum size is 5MB.`, 400));
      }
      
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return next(new AppError(`File ${file.originalname} is not a valid image type. Only JPG, PNG, and WEBP are allowed.`, 400));
      }
    }
    
    next();
  } catch (error) {
    next(new AppError('Error validating uploaded images.', 500));
  }
};

/**
 * Log image upload activity
 */
export const logImageUpload = (req, res, next) => {
  if (req.files || req.file) {
    const files = req.files || [req.file];
    const fileInfo = files.map(file => ({
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      cloudinaryUrl: file.path
    }));
    
    console.log(`Image upload - User: ${req.user?.email || req.vendor?.email || 'Unknown'}, Files:`, fileInfo);
  }
  
  next();
};

/**
 * Clean up failed uploads
 */
export const cleanupFailedUploads = async (req, res, next) => {
  // This middleware should be called when an error occurs after successful upload
  if (req.files || req.file) {
    try {
      const { deleteCloudinaryImage } = await import('../config/cloudinary.js');
      const files = req.files || [req.file];
      
      for (const file of files) {
        if (file.filename) { // Cloudinary public ID
          await deleteCloudinaryImage(file.filename);
          console.log(`Cleaned up failed upload: ${file.filename}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up failed uploads:', error);
    }
  }
  
  next();
};
