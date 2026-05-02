import wrapAsync from "../utility/wrapAsync.js";
import AppError from "../utility/AppError.js";
import Vendors from "../models/VendorSchema.js";
import Products from "../models/ProductSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Reviews from "../models/reviewSchema.js";
import vendorValidationSchema from "../utility/validateVendor.js";
import {
  getProductImageUrl,
  getProductImageUrls,
  getProfileImageUrl,
} from "../utility/imageHelper.js";

const key = "sceret keyyy";

const registerVendor = wrapAsync(async (req, res) => {
  let { vendor } = req.body;
  delete vendor.confirmPassword;

  try {
    // Check if vendor already exists
    const existingVendor = await Vendors.findOne({ email: vendor.email });
    if (existingVendor) {
      return res.redirect(
        "/vendors/login-register?error=An account with this email already exists. Please use a different email or try logging in."
      );
    }

    const salt = await bcrypt.genSalt(10);
    vendor.password = await bcrypt.hash(vendor.password, salt);

    vendorValidationSchema.validate(vendor);
    let newVendor = await Vendors.create(vendor);

    const token = jwt.sign({ email: newVendor.email, isVendor: true }, key);

    delete newVendor.password;

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.redirect("/vendors/home");
  } catch (error) {
    console.error("Vendor registration error:", error);

    // Handle specific MongoDB duplicate key error
    if (error.code === 11000) {
      return res.redirect(
        "/vendors/login-register?error=An account with this email already exists. Please use a different email or try logging in."
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(". ");
      return res.redirect(
        `/vendors/login-register?error=Registration failed: ${errorMessage}`
      );
    }

    return res.redirect(
      "/vendors/login-register?error=An error occurred during registration. Please try again."
    );
  }
});

const logInVendor = wrapAsync(async (req, res) => {
  let { vendor } = req.body;

  try {
    let findVendor = await Vendors.findOne({ email: vendor.email });
    if (!findVendor) {
      return res.redirect(
        "/vendors/login-register?error=Invalid email or password. Please try again."
      );
    }

    const validPassword = await bcrypt.compare(
      vendor.password,
      findVendor.password
    );
    if (!validPassword) {
      return res.redirect(
        "/vendors/login-register?error=Invalid email or password. Please try again."
      );
    }

    delete findVendor.password;

    const token = jwt.sign({ email: findVendor.email, isVendor: true }, key);
    res.cookie("token", token, { httpOnly: true });
    res.redirect("/vendors/home");
  } catch (error) {
    console.error("Vendor login error:", error);
    return res.redirect(
      "/vendors/login-register?error=An error occurred during login. Please try again."
    );
  }
});

const logOut = (req, res) => {
  req.session = "";
  res.clearCookie("token");
  res.redirect("/");
};

const home = wrapAsync(async (req, res) => {
  let { token } = req.cookies;
  let vendorToken = jwt.verify(token, key);
  let vendor = await Vendors.findOne({ email: vendorToken.email }).populate({
    path: "productList",
    populate: {
      path: "review",
      populate: {
        path: "user",
      },
    },
  });

  if (!vendor) {
    throw new AppError("Vendor not found", 404);
  }

  // Import Orders model
  const Orders = (await import("../models/OrderSchema.js")).default;

  // Get all orders that contain vendor's products
  const orders = await Orders.find({
    orderProducts: { $in: vendor.productList.map((p) => p._id) },
  })
    .populate("customer")
    .populate("orderProducts")
    .sort({ createdAt: -1 });

  // Filter orders to only show items from this vendor
  const vendorOrders = orders
    .map((order) => {
      const vendorItems = order.orderProducts.filter((product) =>
        vendor.productList.some(
          (vp) => vp._id.toString() === product._id.toString()
        )
      );

      return {
        ...order.toObject(),
        orderProducts: vendorItems,
        vendorTotal: vendorItems.reduce(
          (sum, item) => sum + (item.price || 0),
          0
        ),
      };
    })
    .filter((order) => order.orderProducts.length > 0);

  // Calculate dashboard statistics
  const totalSales = vendorOrders.reduce(
    (sum, order) => sum + order.vendorTotal,
    0
  );
  const pendingOrders = vendorOrders.filter(
    (o) => o.status === "pending"
  ).length;
  const completedOrders = vendorOrders.filter(
    (o) => o.status === "delivered"
  ).length;

  // Calculate average rating from reviews
  let totalRating = 0;
  let reviewCount = 0;
  vendor.productList.forEach((product) => {
    if (product.review && product.review.length > 0) {
      product.review.forEach((review) => {
        totalRating += review.rating || 0;
        reviewCount++;
      });
    }
  });
  const averageRating =
    reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0;

  // Get recent orders (last 5)
  const recentOrders = vendorOrders.slice(0, 5);

  const dashboardStats = {
    totalSales,
    pendingOrders,
    completedOrders,
    storeRating: averageRating,
    totalProducts: vendor.productList.length,
    totalOrders: vendorOrders.length,
    recentOrders,
  };

  res.render("vendors/home", {
    vendor,
    stats: dashboardStats,
    title: { name: "Dashboard" },
    isLoggedIn: true,
  });
});

const settings = wrapAsync(async (req, res) => {
  let vendor = req.cookies.token;
  let vendorToken = jwt.verify(vendor, key);
  let findvendor = await Vendors.findOne({ email: vendorToken.email }).populate(
    "productList",
    "name"
  );
  findvendor.password = "";
  res.render("vendors/vendorProfile", {
    vendor: findvendor,
    getProfileImageUrl,
  });
});

const orders = wrapAsync(async (req, res) => {
  let { token } = req.cookies;
  let vendorToken = jwt.verify(token, key);
  let vendor = await Vendors.findOne({ email: vendorToken.email }).populate(
    "productList"
  );

  if (!vendor) {
    throw new AppError("Vendor not found", 404);
  }

  // Import Orders model
  const Orders = (await import("../models/OrderSchema.js")).default;

  // Get all orders that contain vendor's products
  const orders = await Orders.find({
    orderProducts: { $in: vendor.productList.map((p) => p._id) },
  })
    .populate("customer")
    .populate("orderProducts")
    .sort({ createdAt: -1 });

  // Filter orders to only show items from this vendor
  const vendorOrders = orders
    .map((order) => {
      const vendorItems = order.orderProducts.filter((product) =>
        vendor.productList.some(
          (vp) => vp._id.toString() === product._id.toString()
        )
      );

      return {
        ...order.toObject(),
        orderProducts: vendorItems,
        vendorTotal: vendorItems.reduce(
          (sum, item) => sum + (item.price || 0),
          0
        ),
      };
    })
    .filter((order) => order.orderProducts.length > 0);

  res.render("vendors/orders", {
    orders: vendorOrders,
    orderCount: vendorOrders.length,
    pendingCount: vendorOrders.filter((o) => o.status === "pending").length,
    processingCount: vendorOrders.filter((o) => o.status === "processing")
      .length,
    completedCount: vendorOrders.filter((o) => o.status === "delivered").length,
  });
});

const products = wrapAsync(async (req, res) => {
  let vendor = req.cookies.token;
  let vendorToken = jwt.verify(vendor, key);
  let findvendor = await Vendors.findOne({ email: vendorToken.email }).populate(
    "productList"
  );
  res.render("vendors/products", {
    products: findvendor,
    getProductImageUrl,
    getProductImageUrls,
  });
});

const deleteVendor = wrapAsync(async (req, res) => {
  let deletedVendor = await Vendors.findByIdAndDelete(req.vendor._id);
  res.clearCookie("token");
  res.redirect("/");
});

const editShow = wrapAsync(async (req, res) => {
  res.render("vendors/edit", {
    editVendor: req.vendor,
    getProfileImageUrl,
  });
});

const editVendor = wrapAsync(async (req, res) => {
  try {
    let editedVendor = req.body.vendor;
    const vendorId = req.params.id;

    // Handle password change if provided
    if (editedVendor.currentPassword && editedVendor.newPassword) {
      const existingVendor = await Vendors.findById(vendorId);

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        editedVendor.currentPassword,
        existingVendor.password
      );

      if (!isCurrentPasswordValid) {
        return res.redirect(
          "/vendors/edit?error=Current password is incorrect."
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      editedVendor.password = await bcrypt.hash(editedVendor.newPassword, salt);
    }

    // Remove password fields that shouldn't be saved
    delete editedVendor.currentPassword;
    delete editedVendor.newPassword;
    delete editedVendor.confirmPassword;

    // Handle Cloudinary profile image upload
    if (req.file) {
      // Delete old profile image from Cloudinary if it exists
      const existingVendor = await Vendors.findById(vendorId);
      if (existingVendor.profileImage && existingVendor.profileImage.publicId) {
        try {
          const { deleteCloudinaryImage } = await import(
            "../config/cloudinary.js"
          );
          await deleteCloudinaryImage(existingVendor.profileImage.publicId);
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }

      editedVendor.profileImage = {
        url: req.file.path,
        publicId: req.file.filename,
        filename: req.file.originalname,
      };
    }

    vendorValidationSchema.validate(editedVendor);
    let findVendor = await Vendors.findByIdAndUpdate(vendorId, editedVendor, {
      new: true,
    });
    res.redirect("/vendors/settings");
  } catch (error) {
    console.error("Vendor edit error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(". ");
      return res.redirect(`/vendors/edit?error=Update failed: ${errorMessage}`);
    }

    return res.redirect(
      "/vendors/edit?error=An error occurred while updating your profile. Please try again."
    );
  }
});

const showreviews = wrapAsync(async (req, res) => {
  let { token } = req.cookies;
  let vendorEmail = jwt.verify(token, key);
  vendorEmail = vendorEmail.email;

  // let vendor = await Vendors.find({email:vendorEmail}).populate('productList');

  let vendor = await Vendors.findOne({ email: vendorEmail }).populate({
    path: "productList",
    populate: {
      path: "review",
      populate: {
        path: "user",
      },
    },
  });

  let listOfProducts = vendor.productList;

  let reviews = vendor.productList;
  let reviewArray = [];

  for (let i of reviews) {
    i.image = "";
    reviewArray.push(...i.review);
  }

  // res.send(reviewArray);
  res.render("vendors/showReviews", { reviewArray });
});

const vendorControll = {
  logInVendor,
  registerVendor,
  logOut,
  home,
  settings,
  products,
  orders,
  deleteVendor,
  editShow,
  editVendor,
  showreviews,
};

export default vendorControll;
