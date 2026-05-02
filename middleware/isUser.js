import jwt from "jsonwebtoken";
import Users from "../models/UserSchema.js";
import wrapAsync from "../utility/wrapAsync.js";
import AppError from "../utility/AppError.js";
const key = "sceret keyyy";

const isUser = wrapAsync(async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      // Check if this is a cart-related route
      if (
        req.originalUrl.includes("/cart") ||
        req.originalUrl.includes("/show-cart")
      ) {
        // Store the original URL to redirect back after login
        req.session.returnUrl = req.originalUrl;
        return res.redirect(
          "/login-register?message=Please login to access your cart"
        );
      }
      return next(new AppError("Unauthorized", 401));
    }

    const result = jwt.verify(token, key);
    const findUser = await Users.findOne({ email: result.email });

    if (!findUser) {
      // Check if this is a cart-related route
      if (
        req.originalUrl.includes("/cart") ||
        req.originalUrl.includes("/show-cart")
      ) {
        req.session.returnUrl = req.originalUrl;
        return res.redirect(
          "/login-register?message=Please login to access your cart"
        );
      }
      return next(new AppError("You are not authorized", 403));
    }
    findUser.password = "";
    findUser.image = "";
    req.user = findUser;
    next();
  } catch (err) {
    // Check if this is a cart-related route
    if (
      req.originalUrl.includes("/cart") ||
      req.originalUrl.includes("/show-cart")
    ) {
      req.session.returnUrl = req.originalUrl;
      return res.redirect(
        "/login-register?message=Invalid session. Please login again"
      );
    }
    next(new AppError("Invalid token or authentication failed", 401));
  }
});

export default isUser;
