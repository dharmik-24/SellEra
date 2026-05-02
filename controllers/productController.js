// productController.js
import Products from "../models/ProductSchema.js";
import Vendors from "../models/VendorSchema.js";
import jwt from "jsonwebtoken";
import AppError from "../utility/AppError.js";
import {
  getProductImageUrl,
  getProductImageUrls,
} from "../utility/imageHelper.js";

const key = "sceret keyyy";

export const getAllProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, sort } = req.query;

  // Build filter object
  let filter = {};

  // Search functionality
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Category filter
  if (category && category !== "all") {
    filter.category = category;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // Build sort object
  let sortObj = {};
  switch (sort) {
    case "price-low":
      sortObj.price = 1;
      break;
    case "price-high":
      sortObj.price = -1;
      break;
    case "name":
      sortObj.name = 1;
      break;
    case "newest":
      sortObj.createdAt = -1;
      break;
    default:
      sortObj.createdAt = -1;
  }

  const showdata = await Products.find(filter).sort(sortObj);

  if (!showdata) {
    throw new AppError("Products not found", 404);
  }

  // Get all categories for filter dropdown
  const categories = await Products.distinct("category");

  res.render("products/productsList", {
    showdata,
    categories,
    currentFilters: { search, category, minPrice, maxPrice, sort },
    isLoggedIn: req.isLoggedIn,
    title: { name: "All Products" },
    getProductImageUrl,
    getProductImageUrls,
  });
};

export const getProductsByCategory = async (req, res) => {
  const { category } = req.params;
  const showdata = await Products.find({ category: category });
  if (!showdata) {
    throw new AppError("Products not found", 404);
  }

  // Get all categories for filter dropdown
  const categories = await Products.distinct("category");

  res.render("products/productsList", {
    showdata,
    categories,
    currentFilters: {
      search: "",
      category: category,
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    },
    isLoggedIn: req.isLoggedIn,
    title: { name: category },
    getProductImageUrl,
    getProductImageUrls,
  });
};

export const renderNewProductForm = (req, res) => {
  res.render("products/new", {
    title: { name: "Add Product" },
    isLoggedIn: req.isLoggedIn,
  });
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const product = await Products.findById(id).populate({
    path: "review",
    populate: {
      path: "user",
      model: "Users",
    },
  });
  const isVendor = req.isVendor;
  if (!product.review) product.review = false;
  res.render("products/show", {
    product,
    isLoggedIn: req.isLoggedIn,
    title: { name: "Product show" },
    isVendor,
    review: product.review,
    getProductImageUrl,
    getProductImageUrls,
  });
};

export const renderEditProductForm = async (req, res) => {
  const { id } = req.params;
  const editProduct = await Products.findById(id);
  if (!editProduct) {
    throw new AppError("Product not found", 404);
  }
  res.render("products/edit", {
    editProduct,
    isLoggedIn: req.isLoggedIn,
    title: { name: "Edit Product" },
  });
};

export const createProduct = async (req, res) => {
  const { product } = req.body;
  const vendor = req.cookies.token;
  const vendorToken = jwt.verify(vendor, key);
  const findvendor = await Vendors.findOne({ email: vendorToken.email });
  if (!findvendor) {
    throw new AppError("Vendor not found", 404);
  }

  const createdProduct = await Products.create(product);

  // Handle Cloudinary images
  if (req.files && req.files.length > 0) {
    const images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      filename: file.originalname,
    }));
    createdProduct.images = images;
  }

  await createdProduct.save();
  findvendor.productList.push(createdProduct._id);
  createdProduct.vendorName = findvendor._id;
  await findvendor.save();
  await createdProduct.save();
  res.redirect("/vendors/home");
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { product } = req.body;
  const updateProduct = await Products.findByIdAndUpdate(
    id,
    { ...product },
    { new: true }
  );
  if (!updateProduct) {
    throw new AppError("Product not found", 404);
  }

  // Handle new Cloudinary images
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      filename: file.originalname,
    }));

    // Add new images to existing ones or replace them
    if (product.replaceImages === "true") {
      // Delete old images from Cloudinary if replacing
      if (updateProduct.images && updateProduct.images.length > 0) {
        const { deleteCloudinaryImage } = await import(
          "../config/cloudinary.js"
        );
        for (const image of updateProduct.images) {
          try {
            await deleteCloudinaryImage(image.publicId);
          } catch (error) {
            console.error("Error deleting old image:", error);
          }
        }
      }
      updateProduct.images = newImages;
    } else {
      // Append new images to existing ones
      updateProduct.images = [...(updateProduct.images || []), ...newImages];
    }
  }

  await updateProduct.save();
  res.redirect("/vendors/products");
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const deleteProduct = await Products.findByIdAndDelete(id);
  if (!deleteProduct) {
    throw new AppError("Product not found", 404);
  }
  await Vendors.findByIdAndUpdate(req.vendor._id, {
    $pull: { productList: id },
  });
  res.redirect("/vendors/products");
};
