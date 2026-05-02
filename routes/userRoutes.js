import express from "express";
const route = express.Router();
import userControll from "../controllers/userAuthController.js";
import isUser from "../middleware/isUser.js";
import { uploadUserProfile } from "../config/cloudinary.js";

route.use(express.json());
route.use(express.urlencoded({ extended: true }));

// Authentication routes
route.post("/login", userControll.logInUser);
route.post("/register", userControll.registerUser);
route.get("/logout", userControll.logOut);

// Profile routes
route.get("/profile", isUser, userControll.profile);
route.get("/edit", isUser, userControll.editShow);
route.patch(
  "/:id",
  isUser,
  uploadUserProfile.single("user[profileImage]"),
  userControll.editUser
);
route.delete("/", isUser, userControll.deleteUser);

// Cart routes
route.get("/cart/:id", isUser, userControll.addCart);
route.get("/show-cart", isUser, userControll.showCart);
route.delete("/cart/:id", isUser, userControll.removeFromCart);
route.patch("/cart/:id", isUser, userControll.updateCartQuantity);

export default route;
