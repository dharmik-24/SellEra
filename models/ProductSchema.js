import mongoose from "mongoose";
import Vendors from "./VendorSchema.js";
import Reviews from "./reviewSchema.js";

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: [3, "too short name"],
  },
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
      filename: String,
    },
  ],
  // Keep the old image field for backward compatibility during migration
  image: {
    data: Buffer,
    contentType: String,
  },
  description: {
    type: String,
    min: [15, "too short description..!!"],
  },
  price: {
    type: Number,
    require: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ["Electronics", "Clothing", "Accessories"],
  },
  sale: {
    type: Number,
    default: 0,
  },
  qty: {
    type: Number,
    default: 0,
    min: 0,
  },
  vendorName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendors",
  },
  review: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reviews",
    },
  ],
});

ProductSchema.pre("findOneAndDelete", async function (next) {
  try {
    const product = await this.model.findOne(this.getFilter()); // Get the vendor document being deleted
    if (product && product.review && product.review.length > 0) {
      // Delete associated products
      await Reviews.deleteMany({ _id: { $in: product.review } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-delete middleware for findByIdAndDelete
ProductSchema.pre("findByIdAndDelete", async function (next) {
  try {
    const product = await this.model.findOne(this.getFilter()); // Get the product document being deleted
    if (product && product.review && product.review.length > 0) {
      // Delete associated Reviews
      await Reviews.deleteMany({ _id: { $in: product.review } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Products = mongoose.model("Products", ProductSchema);
export default Products;
