import mongoose from "mongoose";
import Users from "./UserSchema.js"; // Assuming you have a UserSchema
import Products from "./ProductSchema.js"; // Assuming you have a ProductSchema

const reviewSchema = new mongoose.Schema({
  star: {
    type: Number,
    required: true,
    min: 1, // Ensure star rating is at least 1
    max: 5, // Ensure star rating is at most 5
  },
  review: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, // Add product reference
    ref: "Users",
    required: true,
  },
  product:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Products',
    required:true,
  }
});



reviewSchema.index({ user: 1, product: 1 }, { unique: true });
const Reviews = mongoose.model("Reviews", reviewSchema);
export default Reviews;
