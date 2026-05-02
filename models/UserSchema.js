import mongoose, { Schema } from "mongoose";
import Products from "./ProductSchema.js";
import Orders from "./OrderSchema.js";
import Reviews from "./reviewSchema.js";

import fs from "fs"; // Import the file system module

// Function to read the default profile picture into a buffer
const getDefaultProfilePictureBuffer = () => {
  try {
    const defaultImagePath = "./defaultProfile.webp"; // Replace with the actual path
    return fs.readFileSync(defaultImagePath);

    console.log(defaultImagePath);
    console.log(fs.existsSync(defaultImagePath));
  } catch (error) {
    console.error("Error reading default profile picture:", error);
    return null; // Handle the error appropriately, perhaps log it and return null or a placeholder.
  }
};

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: [3, "too short name"],
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
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
    },
  ],
  orderHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Orders",
    },
  ],
  description: {
    type: String,
    default: "",
  },
  review: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reviews",
    },
  ],
});

UserSchema.pre("findOneAndDelete", async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter()); // Get the vendor document being deleted
    if (user && user.review && user.review.length > 0) {
      // Delete associated products
      await Reviews.deleteMany({ _id: { $in: user.review } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-delete middleware for findByIdAndDelete
UserSchema.pre("findByIdAndDelete", async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter()); // Get the user document being deleted
    if (user && user.review && user.review.length > 0) {
      // Delete associated Reviews
      await Reviews.deleteMany({ _id: { $in: user.review } });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Users = mongoose.model("Users", UserSchema);
export default Users;
