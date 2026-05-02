import jwt from "jsonwebtoken";
import Vendors from "../models/VendorSchema.js";
import wrapAsync from "../utility/wrapAsync.js";
import AppError from "../utility/AppError.js";

const key = "sceret keyyy";

const roleCheck = wrapAsync(async (req, res, next) => {
  let { token } = req.cookies;
  if (token) {
    const result = jwt.verify(token, key);
    let vendor = await Vendors.findOne({ email: result.email });
    if(vendor){
        req.isVendor=true;
    }
    req.vendor=vendor;
  }
  next();
});

export default roleCheck;
