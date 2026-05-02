import wrapAsync from "../utility/wrapAsync.js";
import AppError from "../utility/AppError.js";
import Users from "../models/UserSchema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Products from "../models/ProductSchema.js";
import Orders from "../models/OrderSchema.js";
import userValidationSchema from "../utility/validateUser.js";
import {
  getProductImageUrl,
  getProductImageUrls,
  getProfileImageUrl,
} from "../utility/imageHelper.js";
const key = "sceret keyyy";

const logInUser = wrapAsync(async (req, res) => {
  let { user } = req.body;

  try {
    let findUser = await Users.findOne({ email: user.email });
    if (!findUser) {
      return res.redirect(
        "/login-register?error=Invalid email or password. Please try again."
      );
    }

    const validPassword = await bcrypt.compare(
      user.password,
      findUser.password
    );
    if (!validPassword) {
      return res.redirect(
        "/login-register?error=Invalid email or password. Please try again."
      );
    }

    delete findUser.password;

    const token = jwt.sign({ email: findUser.email }, key);

    req.user = findUser;
    req.isLoggedIn = true;

    res.cookie("token", token, { httpOnly: true });

    // Check if there's a return URL stored in session
    const returnUrl = req.session.returnUrl;
    if (returnUrl) {
      delete req.session.returnUrl; // Clear the stored URL
      res.redirect(returnUrl);
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.redirect(
      "/login-register?error=An error occurred during login. Please try again."
    );
  }
});

const registerUser = wrapAsync(async (req, res) => {
  let { user } = req.body;
  delete user.confirmPassword;

  try {
    // Check if user already exists
    const existingUser = await Users.findOne({ email: user.email });
    if (existingUser) {
      return res.redirect(
        "/login-register?error=An account with this email already exists. Please use a different email or try logging in."
      );
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    userValidationSchema.validate(user);
    const newUser = await Users.create(user);

    const token = jwt.sign({ email: user.email }, key);

    delete newUser.password;
    req.user = newUser;
    req.isLoggedIn = true;
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.redirect("/");
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific MongoDB duplicate key error
    if (error.code === 11000) {
      return res.redirect(
        "/login-register?error=An account with this email already exists. Please use a different email or try logging in."
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(". ");
      return res.redirect(
        `/login-register?error=Registration failed: ${errorMessage}`
      );
    }

    return res.redirect(
      "/login-register?error=An error occurred during registration. Please try again."
    );
  }
});

const profile = wrapAsync(async (req, res) => {
  let id = req.user._id;
  let findUser = await Users.findById(id);

  // Calculate user statistics
  const totalOrders = await Orders.countDocuments({ customer: id });
  const cartItems = findUser.cart ? findUser.cart.length : 0;
  const accountAge =
    Math.floor((Date.now() - findUser.createdAt) / (1000 * 60 * 60 * 24)) || 0;

  const userStats = {
    totalOrders: totalOrders,
    reviewsGiven: 0, // Will be implemented when review system is available
    wishlistItems: cartItems, // Using cart items as wishlist for now
    accountAge: accountAge,
  };

  res.render("users/userProfile", {
    user: findUser,
    userStats,
    title: { name: "profile Page" },
    isLoggedIn: req.user,
    getProfileImageUrl,
  });
});

const addCart = wrapAsync(async (req, res) => {
  let id = req.params.id;
  let product = await Products.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existingItem = req.session.cart.find((item) => {
    try {
      if (item && item.product && item.product._id) {
        return item.product._id.toString() === id;
      }
      return false;
    } catch (error) {
      console.error("Error in cart item check:", error);
      return false; // Or handle the error appropriately
    }
  });

  if (existingItem) {
    existingItem.quantity++;
  } else {
    req.session.cart.push({ product: product, quantity: 1 });
  }

  res.redirect("/users/show-cart");
});

const showCart = (req, res) => {
  let products = req.session.cart;
  let total = 0;
  // res.send(products)
  if (!products) {
    products = false;
  } else {
    for (let i of products) {
      let perProductAmm = i.product.price * i.quantity;
      total += perProductAmm;
    }
  }
  res.render("users/cart", {
    products,
    title: { name: "Cart" },
    isLoggedIn: req.user,
    total,
    getProductImageUrl,
    getProductImageUrls,
  });
};

// User logout
const logOut = (req, res) => {
  req.session.destroy();
  res.clearCookie("token");
  res.redirect("/");
};

// Remove item from cart
const removeFromCart = wrapAsync(async (req, res) => {
  const { id } = req.params;

  if (!req.session.cart) {
    return res.redirect("/users/show-cart");
  }

  req.session.cart = req.session.cart.filter(
    (item) => item.product._id.toString() !== id
  );

  res.redirect("/users/show-cart");
});

// Update cart item quantity
const updateCartQuantity = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!req.session.cart || quantity < 1) {
    return res.redirect("/users/show-cart");
  }

  const cartItem = req.session.cart.find(
    (item) => item.product._id.toString() === id
  );

  if (cartItem) {
    cartItem.quantity = parseInt(quantity);
  }

  res.redirect("/users/show-cart");
});

// Show user edit form
const editShow = wrapAsync(async (req, res) => {
  const user = req.user;
  res.render("users/edit", {
    user,
    title: { name: "Edit Profile" },
    isLoggedIn: req.user,
    getProfileImageUrl,
  });
});

// Update user profile
const editUser = wrapAsync(async (req, res) => {
  try {
    const { user: userData } = req.body;
    const userId = req.user._id;

    // Handle password change if provided
    if (userData.currentPassword && userData.password) {
      const existingUser = await Users.findById(userId);

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        userData.currentPassword,
        existingUser.password
      );

      if (!isCurrentPasswordValid) {
        return res.redirect("/users/edit?error=Current password is incorrect.");
      }

      // Verify password confirmation
      if (userData.password !== userData.confirmPassword) {
        return res.redirect("/users/edit?error=New passwords do not match.");
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    } else if (userData.password || userData.currentPassword) {
      // If only one password field is provided, show error
      return res.redirect(
        "/users/edit?error=Please provide both current password and new password to change your password."
      );
    }

    // Remove password fields that shouldn't be saved
    delete userData.currentPassword;
    delete userData.confirmPassword;

    // Handle Cloudinary profile image upload
    if (req.file) {
      // Delete old profile image from Cloudinary if it exists
      const existingUser = await Users.findById(userId);
      if (existingUser.profileImage && existingUser.profileImage.publicId) {
        try {
          const { deleteCloudinaryImage } = await import(
            "../config/cloudinary.js"
          );
          await deleteCloudinaryImage(existingUser.profileImage.publicId);
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }

      userData.profileImage = {
        url: req.file.path,
        publicId: req.file.filename,
        filename: req.file.originalname,
      };
    }

    const updatedUser = await Users.findByIdAndUpdate(userId, userData, {
      new: true,
    });

    if (!updatedUser) {
      return res.redirect("/users/edit?error=User not found.");
    }

    res.redirect("/users/profile");
  } catch (error) {
    console.error("User edit error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(". ");
      return res.redirect(`/users/edit?error=Update failed: ${errorMessage}`);
    }

    return res.redirect(
      "/users/edit?error=An error occurred while updating your profile. Please try again."
    );
  }
});

// Delete user account
const deleteUser = wrapAsync(async (req, res) => {
  const userId = req.user._id;

  await Users.findByIdAndDelete(userId);

  req.session.destroy();
  res.clearCookie("token");
  res.redirect("/");
});

const userControll = {
  logInUser,
  registerUser,
  profile,
  addCart,
  showCart,
  logOut,
  removeFromCart,
  updateCartQuantity,
  editShow,
  editUser,
  deleteUser,
};
export default userControll;
