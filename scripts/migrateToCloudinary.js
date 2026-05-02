import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import Products from '../models/ProductSchema.js';
import Users from '../models/UserSchema.js';
import Vendors from '../models/VendorSchema.js';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer image to Cloudinary
 */
async function uploadBufferToCloudinary(buffer, contentType, folder, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename,
        resource_type: 'image',
        format: contentType.split('/')[1] || 'jpg'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

/**
 * Migrate product images
 */
async function migrateProductImages() {
  console.log('Starting product image migration...');
  
  const products = await Products.find({
    'image.data': { $exists: true },
    images: { $exists: false }
  });
  
  console.log(`Found ${products.length} products with old image format`);
  
  for (const product of products) {
    try {
      if (product.image && product.image.data) {
        console.log(`Migrating image for product: ${product.name}`);
        
        const filename = `product_${product._id}_${Date.now()}`;
        const result = await uploadBufferToCloudinary(
          product.image.data,
          product.image.contentType,
          'sellera/products',
          filename
        );
        
        // Update product with new image format
        product.images = [{
          url: result.secure_url,
          publicId: result.public_id,
          filename: filename
        }];
        
        await product.save();
        console.log(`✓ Migrated image for product: ${product.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to migrate image for product ${product.name}:`, error);
    }
  }
  
  console.log('Product image migration completed');
}

/**
 * Migrate user profile images
 */
async function migrateUserImages() {
  console.log('Starting user profile image migration...');
  
  const users = await Users.find({
    'image.data': { $exists: true },
    profileImage: { $exists: false }
  });
  
  console.log(`Found ${users.length} users with old image format`);
  
  for (const user of users) {
    try {
      if (user.image && user.image.data) {
        console.log(`Migrating profile image for user: ${user.name}`);
        
        const filename = `user_${user._id}_${Date.now()}`;
        const result = await uploadBufferToCloudinary(
          user.image.data,
          user.image.contentType,
          'sellera/users',
          filename
        );
        
        // Update user with new image format
        user.profileImage = {
          url: result.secure_url,
          publicId: result.public_id,
          filename: filename
        };
        
        await user.save();
        console.log(`✓ Migrated profile image for user: ${user.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to migrate profile image for user ${user.name}:`, error);
    }
  }
  
  console.log('User profile image migration completed');
}

/**
 * Migrate vendor profile images
 */
async function migrateVendorImages() {
  console.log('Starting vendor profile image migration...');
  
  const vendors = await Vendors.find({
    'image.data': { $exists: true },
    profileImage: { $exists: false }
  });
  
  console.log(`Found ${vendors.length} vendors with old image format`);
  
  for (const vendor of vendors) {
    try {
      if (vendor.image && vendor.image.data) {
        console.log(`Migrating profile image for vendor: ${vendor.name}`);
        
        const filename = `vendor_${vendor._id}_${Date.now()}`;
        const result = await uploadBufferToCloudinary(
          vendor.image.data,
          vendor.image.contentType,
          'sellera/vendors',
          filename
        );
        
        // Update vendor with new image format
        vendor.profileImage = {
          url: result.secure_url,
          publicId: result.public_id,
          filename: filename
        };
        
        await vendor.save();
        console.log(`✓ Migrated profile image for vendor: ${vendor.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to migrate profile image for vendor ${vendor.name}:`, error);
    }
  }
  
  console.log('Vendor profile image migration completed');
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1/SellEradb";
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Run migrations
    await migrateProductImages();
    await migrateUserImages();
    await migrateVendorImages();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNote: Old image data is still preserved in the database.');
    console.log('You can remove the old image fields after verifying the migration.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
