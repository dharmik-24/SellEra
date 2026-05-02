import mongoose from "mongoose";
import Products from "./ProductSchema.js";

const VendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: [3, "Name is too short"],
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    url: String,
    publicId: String,
    filename: String,
  },
  // Keep the old image field for backward compatibility during migration
  image: {
    data: Buffer,
    contentType: String,
  },
  description: {
    type: String,
    min: [15, "description is too short"],
  },
  productList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
    },
  ],
});

VendorSchema.pre("findOneAndDelete", async function (next) {
  try {
    const vendor = await this.model.findOne(this.getFilter()); // Get the vendor document being deleted
    if (vendor && vendor.productList && vendor.productList.length > 0) {
      // Delete associated products
      await Products.deleteMany({ _id: { $in: vendor.productList } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-delete middleware for findByIdAndDelete
VendorSchema.pre("findByIdAndDelete", async function (next) {
  try {
    const vendor = await this.model.findOne(this.getFilter()); // Get the vendor document being deleted
    if (vendor && vendor.productList && vendor.productList.length > 0) {
      // Delete associated products
      await Products.deleteMany({ _id: { $in: vendor.productList } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Vendors = mongoose.model("Vendors", VendorSchema);

export default Vendors;
