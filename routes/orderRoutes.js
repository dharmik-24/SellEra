import express from "express";
const route = express.Router();
import orderController from "../controllers/orderController.js";
import isUser from "../middleware/isUser.js";
import isVendor from "../middleware/isVendor.js";

route.use(express.json());
route.use(express.urlencoded({ extended: true }));

// User order routes
route.post("/create", isUser, orderController.createOrder);
route.get("/:id/confirmation", isUser, orderController.getOrderConfirmation);
route.get("/history", isUser, orderController.getUserOrders);
route.get("/:id", isUser, orderController.getOrderDetails);

// Vendor order routes
route.get("/vendor/all", isVendor, orderController.getVendorOrders);
route.patch("/:id/status", isVendor, orderController.updateOrderStatus);

export default route;
