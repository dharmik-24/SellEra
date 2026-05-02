import express from "express";
const route = express.Router();
import isUser from "../middleware/isUser.js";
import jwt from "jsonwebtoken";
import Users from "../models/UserSchema.js";
import wrapAsync from "../utility/wrapAsync.js";
import Products from "../models/ProductSchema.js";
import Reviews from "../models/reviewSchema.js";
import AppError from "../utility/AppError.js";

const key = "sceret keyyy";

route.use(express.json());
route.use(express.urlencoded({ extended: true }));

route.get(
  "/new/:id",
  isUser,
  wrapAsync(async (req, res) => {
    res.render("reviews/new", {
      title: { name: "Add Review" },
      isLoggedIn: req.user.isLoggedIn,
      id: req.params.id,
    });
  })
);
route.post(
  "/:id",
  wrapAsync(async (req, res) => {
    let { review } = req.body;
    let { token } = req.cookies;
    let email = jwt.verify(token, key);
    email = email.email;

    let findUser = await Users.findOne({ email });

    review.user = findUser._id;

    let findProduct = await Products.findById(req.params.id);
    if (!findProduct) {
      throw new AppError("Product not found.", 404);
    }

    review.product = findProduct._id;


    const existingReview = await Reviews.findOne({ user: findUser._id, product: findProduct._id });

    if (!existingReview) {
      let createdReview = await Reviews.create(review);
      findProduct.review.push(createdReview._id);
      findUser.review.push(createdReview._id);
      await findUser.save();
      await findProduct.save();
      res.redirect(`/products/${req.params.id}`);
    } else {
      throw new AppError("User has already submitted a review for this product.", 300);
    }
  })
);


export default route;
