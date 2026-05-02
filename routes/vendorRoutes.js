import express from "express";
const route = express.Router();
import vendorControll from "../controllers/vedorAuthController.js";
import session from "express-session";
import cookieParser from "cookie-parser";
import isVendor from "../middleware/isVendor.js";
import { uploadVendorProfile } from "../config/cloudinary.js";

route.use(
  session({
    secret: "your-secret-key", // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true in production with HTTPS
  })
);

route.use(cookieParser());
route.use(express.json());
route.use(express.urlencoded({ extended: true }));

route.get("/login-register", (req, res) => {
  res.render("vendors/login");
});
route.post("/login", vendorControll.logInVendor);
route.post("/register", vendorControll.registerVendor);
route.get("/logout", vendorControll.logOut);
route.get("/home", isVendor, vendorControll.home);
route.get("/settings", isVendor, vendorControll.settings);
route.get("/products", isVendor, vendorControll.products);
route.get("/orders", isVendor, vendorControll.orders);
route.delete("/", isVendor, vendorControll.deleteVendor);
route.get("/edit", isVendor, vendorControll.editShow);
route.get("/reviews", isVendor, vendorControll.showreviews);
route.patch(
  "/:id",
  isVendor,
  uploadVendorProfile.single("vendor[profileImage]"),
  vendorControll.editVendor
);

export default route;
