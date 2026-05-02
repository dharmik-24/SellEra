// productRoutes.js
import express from "express";
const route = express.Router();
import {
  getAllProducts,
  getProductsByCategory,
  renderNewProductForm,
  getProductById,
  renderEditProductForm,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import wrapAsync from "../utility/wrapAsync.js";
import AppError from "../utility/AppError.js";
import isVendor from "../middleware/isVendor.js";
import cookieParser from "cookie-parser";
import roleCheck from "../middleware/roleCheck.js";
import session from "express-session";
import mO from "method-override";
import {
  uploadProductImage,
  uploadMultipleProductImages,
} from "../config/cloudinary.js";
import {
  handleImageUploadError,
  validateImages,
  logImageUpload,
} from "../middleware/imageUploadHandler.js";

route.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
route.use(cookieParser());
route.use(express.json());
route.use(express.urlencoded({ extended: true }));
route.use(mO("_method"));

const isCategory = (req, res, next) => {
  let { category } = req.params;
  let Cat = ["Electronics", "Clothing", "Accessories"];
  if (Cat.includes(category)) {
    return next();
  }
  throw new AppError("Page not found", 404);
};

route.use((req, res, next) => {
  req.isLoggedIn = !!req.cookies.token;
  next();
});

route.get("/", wrapAsync(getAllProducts));
route.get("/category/:category", isCategory, wrapAsync(getProductsByCategory));
route.get("/new", isVendor, renderNewProductForm);
route.get("/:id", roleCheck, wrapAsync(getProductById));
route.get("/:id/edit", wrapAsync(renderEditProductForm));
route.post(
  "/",
  uploadProductImage.array("product[images]", 5),
  handleImageUploadError,
  validateImages,
  logImageUpload,
  wrapAsync(createProduct)
);
route.patch(
  "/:id",
  isVendor,
  uploadProductImage.array("product[images]", 5),
  handleImageUploadError,
  validateImages,
  logImageUpload,
  wrapAsync(updateProduct)
);
route.delete("/:id", isVendor, wrapAsync(deleteProduct));

export default route;
