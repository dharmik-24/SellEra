import wrapAsync from "../utility/wrapAsync.js";
import AppError from "../utility/AppError.js";
import Orders from "../models/OrderSchema.js";
import Products from "../models/ProductSchema.js";
import Users from "../models/UserSchema.js";
import Vendors from "../models/VendorSchema.js";
import jwt from "jsonwebtoken";

const key = "sceret keyyy";

// Create order from cart
const createOrder = wrapAsync(async (req, res) => {
  const { token } = req.cookies;
  if (!token) {
    throw new AppError("Please login to place an order", 401);
  }

  const decoded = jwt.verify(token, key);
  const user = await Users.findOne({ email: decoded.email });
  
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const cartItems = req.session.cart;
  if (!cartItems || cartItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // Calculate total and prepare order items
  let total = 0;
  const orderProducts = [];
  
  for (let item of cartItems) {
    const product = await Products.findById(item.product._id);
    if (!product) {
      throw new AppError(`Product ${item.product.name} not found`, 404);
    }
    
    // Check stock availability
    if (product.qty < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.qty}`, 400);
    }
    
    // Update product stock
    product.qty -= item.quantity;
    await product.save();
    
    orderProducts.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price
    });
    
    total += product.price * item.quantity;
  }

  // Add tax (18%)
  const tax = Math.round(total * 0.18);
  const finalTotal = total + tax;

  // Create order
  const order = await Orders.create({
    orderProducts: orderProducts.map(item => item.product),
    customer: user._id,
    date: new Date().toISOString().split('T')[0],
    total: finalTotal,
    status: 'pending',
    items: orderProducts,
    subtotal: total,
    tax: tax
  });

  // Add order to user's order history
  user.orderHistory = user.orderHistory || [];
  user.orderHistory.push(order._id);
  await user.save();

  // Clear cart
  req.session.cart = [];

  res.redirect(`/orders/${order._id}/confirmation`);
});

// Get order confirmation
const getOrderConfirmation = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const order = await Orders.findById(id)
    .populate('customer')
    .populate('orderProducts');
    
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.render('orders/confirmation', {
    order,
    title: { name: 'Order Confirmation' },
    isLoggedIn: req.user
  });
});

// Get user's order history
const getUserOrders = wrapAsync(async (req, res) => {
  const user = req.user;
  const orders = await Orders.find({ customer: user._id })
    .populate('orderProducts')
    .sort({ createdAt: -1 });

  res.render('orders/history', {
    orders,
    title: { name: 'Order History' },
    isLoggedIn: req.user
  });
});

// Get single order details
const getOrderDetails = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const order = await Orders.findById(id)
    .populate('customer')
    .populate('orderProducts');
    
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Check if user owns this order
  if (order.customer._id.toString() !== req.user._id.toString()) {
    throw new AppError("Unauthorized to view this order", 403);
  }

  res.render('orders/details', {
    order,
    title: { name: 'Order Details' },
    isLoggedIn: req.user
  });
});

// Vendor: Get all orders for vendor's products
const getVendorOrders = wrapAsync(async (req, res) => {
  const { token } = req.cookies;
  const decoded = jwt.verify(token, key);
  const vendor = await Vendors.findOne({ email: decoded.email }).populate('productList');
  
  if (!vendor) {
    throw new AppError("Vendor not found", 404);
  }

  // Get all orders that contain vendor's products
  const orders = await Orders.find({
    orderProducts: { $in: vendor.productList.map(p => p._id) }
  })
  .populate('customer')
  .populate('orderProducts')
  .sort({ createdAt: -1 });

  // Filter orders to only show items from this vendor
  const vendorOrders = orders.map(order => {
    const vendorItems = order.orderProducts.filter(product => 
      vendor.productList.some(vp => vp._id.toString() === product._id.toString())
    );
    
    return {
      ...order.toObject(),
      orderProducts: vendorItems,
      vendorTotal: vendorItems.reduce((sum, item) => sum + (item.price || 0), 0)
    };
  }).filter(order => order.orderProducts.length > 0);

  res.render('vendors/orders', {
    orders: vendorOrders,
    title: { name: 'Orders Management' },
    isLoggedIn: true
  });
});

// Update order status (vendor)
const updateOrderStatus = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid order status", 400);
  }

  const order = await Orders.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.json({ success: true, message: "Order status updated successfully" });
});

const orderController = {
  createOrder,
  getOrderConfirmation,
  getUserOrders,
  getOrderDetails,
  getVendorOrders,
  updateOrderStatus
};

export default orderController;
