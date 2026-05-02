import jwt from "jsonwebtoken";
import Vendors from "../models/VendorSchema.js";
import wrapAsync from "../utility/wrapAsync.js";
import AppError from "../utility/AppError.js";
const key = "sceret keyyy";

const isVendor = wrapAsync(async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }

    const result = jwt.verify(token, key);

    const findVendor = await Vendors.findOne({ email: result.email });

    if (!findVendor) {
      return next(new AppError("You are not authorized", 403));
    }
    req.vendor = findVendor;
    req.vendor.password='';
    req.vendor.image='';
    next();
  } catch (err) {
    next(new AppError("Invalid token or authentication failed", 401));
  }
});

export default isVendor;
