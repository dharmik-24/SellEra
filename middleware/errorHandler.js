/**
 * Error Handler Middleware for SellEra
 * Provides comprehensive error handling with custom error pages
 */

import path from "path";

/**
 * Error page configurations
 */
const errorConfigs = {
  400: {
    title: "Bad Request",
    message: "The request could not be understood by the server.",
    description: "Please check your request and try again.",
    icon: "ri-alert-line",
  },
  401: {
    title: "Unauthorized",
    message: "Authentication is required to access this resource.",
    description: "Please log in to continue.",
    icon: "ri-lock-line",
  },
  403: {
    title: "Access Forbidden",
    message: "You don't have permission to access this resource.",
    description: "This area is restricted and requires special authorization.",
    icon: "ri-lock-line",
  },
  404: {
    title: "Page Not Found",
    message: "The page you're looking for seems to have wandered off.",
    description: "Don't worry, even the best explorers get lost sometimes!",
    icon: "ri-search-line",
  },
  405: {
    title: "Method Not Allowed",
    message: "The requested method is not allowed for this resource.",
    description: "Please check the request method and try again.",
    icon: "ri-close-circle-line",
  },
  408: {
    title: "Request Timeout",
    message: "The server timed out waiting for the request.",
    description: "Please try again or check your connection.",
    icon: "ri-time-line",
  },
  429: {
    title: "Too Many Requests",
    message: "You have sent too many requests in a short period.",
    description: "Please wait a moment before trying again.",
    icon: "ri-spam-line",
  },
  500: {
    title: "Internal Server Error",
    message: "Something went wrong on our end.",
    description: "Our team has been notified and is working to fix this issue.",
    icon: "ri-error-warning-line",
  },
  502: {
    title: "Bad Gateway",
    message: "The server received an invalid response.",
    description: "This is usually a temporary issue. Please try again.",
    icon: "ri-wifi-off-line",
  },
  503: {
    title: "Service Unavailable",
    message: "The service is temporarily unavailable.",
    description: "We're performing maintenance. Please try again later.",
    icon: "ri-tools-line",
  },
  504: {
    title: "Gateway Timeout",
    message: "The server took too long to respond.",
    description: "Please try again or contact support if the issue persists.",
    icon: "ri-time-line",
  },
};

/**
 * Custom Error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Development error handler - shows detailed error information
 */
const sendErrorDev = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const config = errorConfigs[statusCode] || errorConfigs[500];

  // For API requests, send JSON response
  if (req.originalUrl.startsWith("/api")) {
    return res.status(statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // For web requests, render error page
  res.status(statusCode).render("errors/error", {
    statusCode,
    title: config.title,
    message: config.message,
    description: config.description,
    details: `Error: ${err.message}\n\nStack: ${err.stack}`,
    error: err,
  });
};

/**
 * Production error handler - shows user-friendly error pages
 */
const sendErrorProd = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const config = errorConfigs[statusCode] || errorConfigs[500];

  // For API requests, send JSON response
  if (req.originalUrl.startsWith("/api")) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programming or other unknown error: don't leak error details
    console.error("ERROR 💥", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }

  // For web requests, render appropriate error page
  if (err.isOperational) {
    // Check if specific error page exists
    const specificErrorPage = `errors/${statusCode}`;

    res.status(statusCode).render(
      specificErrorPage,
      {
        statusCode,
        title: config.title,
        message: config.message,
        description: config.description,
      },
      (renderErr) => {
        if (renderErr) {
          // Fallback to generic error page
          res.render("errors/error", {
            statusCode,
            title: config.title,
            message: config.message,
            description: config.description,
          });
        }
      }
    );
  } else {
    // Programming or other unknown error
    console.error("ERROR 💥", err);
    res.status(500).render("errors/500", {
      statusCode: 500,
      title: "Internal Server Error",
      message: "Something went wrong on our end.",
      description:
        "Our team has been notified and is working to fix this issue.",
    });
  }
};

/**
 * Handle specific error types
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

/**
 * Main error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

/**
 * 404 handler for undefined routes
 */
const handle404 = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};

/**
 * Async error wrapper to catch async errors
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Loading page middleware
 */
const showLoadingPage = (req, res, next) => {
  // Show loading page for specific routes or conditions
  if (req.query.loading === "true") {
    return res.render("loading");
  }
  next();
};

export {
  AppError,
  globalErrorHandler,
  handle404,
  catchAsync,
  showLoadingPage,
  errorConfigs,
};
