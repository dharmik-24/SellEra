import express from "express";
import Products from "../models/ProductSchema.js";
import AppError from "../utility/AppError.js";
import wrapAsync from "../utility/wrapAsync.js";
import isUser from "../middleware/isUser.js";
import {
  getProductImageUrl,
  getProductImageUrls,
} from "../utility/imageHelper.js";

const route = express.Router();

route.use((req, res, next) => {
  let { token } = req.cookies;
  if (!token) {
    req.isLoggedIn = false;
  } else {
    req.isLoggedIn = true;
  }
  next();
});

route.get(
  "/",
  wrapAsync(async (req, res) => {
    let showdata = await Products.find({});
    if (!showdata) throw new AppError("Products not found", 404);
    res.render("index", {
      showdata,
      title: { name: "Homepage" },
      isLoggedIn: req.isLoggedIn,
      getProductImageUrl,
      getProductImageUrls,
    });
  })
);

route.get("/login-register", (req, res) => {
  res.render("loginRegister");
});

route.post("/user", async (req, res) => {
  res.redirect("/accepted-user");
});

route.post("/logout", (req, res) => {
  req.user = "";
  req.session.destroy();
  req.isLoggedIn = false;
  res.clearCookie("token");
  res.redirect("/");
});
export default route;
