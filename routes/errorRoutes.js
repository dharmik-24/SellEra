/**
 * Error Routes for Testing Error Pages
 * These routes are for testing and demonstration purposes
 */

import express from "express";
const router = express.Router();
import { AppError } from "../middleware/errorHandler.js";

// Middleware to set isLoggedIn for all error routes
router.use((req, res, next) => {
  req.isLoggedIn = !!req.cookies.token;
  next();
});

/**
 * Loading page route
 */
router.get("/loading", (req, res) => {
  res.render("loading");
});

/**
 * Test routes for different error pages
 */

// 404 Error Test
router.get("/test/404", (req, res, next) => {
  const error = new AppError("This is a test 404 error", 404);
  next(error);
});

// 403 Error Test
router.get("/test/403", (req, res, next) => {
  const error = new AppError("Access forbidden - test error", 403);
  next(error);
});

// 500 Error Test
router.get("/test/500", (req, res, next) => {
  const error = new AppError("Internal server error - test", 500);
  next(error);
});

// 401 Error Test
router.get("/test/401", (req, res, next) => {
  const error = new AppError("Unauthorized access - test", 401);
  next(error);
});

// 400 Error Test
router.get("/test/400", (req, res, next) => {
  const error = new AppError("Bad request - test", 400);
  next(error);
});

// 429 Error Test
router.get("/test/429", (req, res, next) => {
  const error = new AppError("Too many requests - test", 429);
  next(error);
});

// 503 Error Test
router.get("/test/503", (req, res, next) => {
  const error = new AppError("Service unavailable - test", 503);
  next(error);
});

/**
 * Direct error page renders (for testing templates)
 */

// Render 404 page directly
router.get("/pages/404", (req, res) => {
  res.status(404).render("errors/404", {
    statusCode: 404,
    title: "Page Not Found",
    message: "The page you're looking for seems to have wandered off.",
    description: "Don't worry, even the best explorers get lost sometimes!",
    isLoggedIn: !!req.cookies.token,
  });
});

// Render 500 page directly
router.get("/pages/500", (req, res) => {
  res.status(500).render("errors/500", {
    statusCode: 500,
    title: "Internal Server Error",
    message: "Something went wrong on our end.",
    description: "Our team has been notified and is working to fix this issue.",
    isLoggedIn: req.isLoggedIn,
  });
});

// Render 403 page directly
router.get("/pages/403", (req, res) => {
  res.status(403).render("errors/403", {
    statusCode: 403,
    title: "Access Forbidden",
    message: "You don't have permission to access this resource.",
    description: "This area is restricted and requires special authorization.",
    isLoggedIn: req.isLoggedIn,
  });
});

// Render generic error page directly
router.get("/pages/error", (req, res) => {
  const statusCode = parseInt(req.query.code) || 500;
  const errorConfigs = {
    400: {
      title: "Bad Request",
      message: "The request could not be understood by the server.",
      description: "Please check your request and try again.",
    },
    401: {
      title: "Unauthorized",
      message: "Authentication is required to access this resource.",
      description: "Please log in to continue.",
    },
    403: {
      title: "Access Forbidden",
      message: "You don't have permission to access this resource.",
      description:
        "This area is restricted and requires special authorization.",
    },
    404: {
      title: "Page Not Found",
      message: "The page you're looking for seems to have wandered off.",
      description: "Don't worry, even the best explorers get lost sometimes!",
    },
    500: {
      title: "Internal Server Error",
      message: "Something went wrong on our end.",
      description:
        "Our team has been notified and is working to fix this issue.",
    },
  };

  const config = errorConfigs[statusCode] || errorConfigs[500];

  res.status(statusCode).render("errors/error", {
    statusCode,
    title: config.title,
    message: config.message,
    description: config.description,
    details: req.query.details || null,
    isLoggedIn: req.isLoggedIn,
  });
});

/**
 * Async error test (to test catchAsync wrapper)
 */
router.get("/test/async-error", async (req, res, next) => {
  // Simulate an async operation that fails
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new AppError("Async operation failed - test", 500));
    }, 100);
  });
});

/**
 * Database error simulation
 */
router.get("/test/db-error", (req, res, next) => {
  // Simulate a database connection error
  const error = new Error("Database connection failed");
  error.name = "MongoNetworkError";
  error.statusCode = 503;
  next(error);
});

/**
 * Validation error simulation
 */
router.get("/test/validation-error", (req, res, next) => {
  const error = new Error("Validation failed");
  error.name = "ValidationError";
  error.errors = {
    email: { message: "Email is required" },
    password: { message: "Password must be at least 8 characters" },
  };
  next(error);
});

/**
 * Error page showcase route
 */
router.get("/showcase", (req, res) => {
  res.render("errors/showcase", {
    title: { name: "Error Pages Showcase" },
    errorTypes: [
      { code: 400, name: "Bad Request", description: "Invalid request format" },
      {
        code: 401,
        name: "Unauthorized",
        description: "Authentication required",
      },
      { code: 403, name: "Forbidden", description: "Access denied" },
      { code: 404, name: "Not Found", description: "Resource not found" },
      {
        code: 429,
        name: "Too Many Requests",
        description: "Rate limit exceeded",
      },
      { code: 500, name: "Server Error", description: "Internal server error" },
      {
        code: 502,
        name: "Bad Gateway",
        description: "Invalid server response",
      },
      {
        code: 503,
        name: "Service Unavailable",
        description: "Service temporarily down",
      },
    ],
    isLoggedIn: req.isLoggedIn,
  });
});

/**
 * Loading page with progress simulation
 */
router.get("/loading-demo", (req, res) => {
  res.render("loading", {
    title: "Loading Demo",
    redirectUrl: req.query.redirect || "/",
    loadingTime: req.query.time || 3000,
  });
});

export default router;
