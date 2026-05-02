import express from "express";
const app = express();
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Load environment variables
dotenv.config();
import productsRoutes from "./routes/productsRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import errorRoutes from "./routes/errorRoutes.js";
import mO from "method-override";
import cookieParser from "cookie-parser";
import session from "express-session";
import {
  globalErrorHandler,
  handle404,
  showLoadingPage,
} from "./middleware/errorHandler.js";

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mO("_method"));

// Loading page middleware
app.use(showLoadingPage);

// Routes
app.use("/products", productsRoutes);
app.use("/vendors", vendorRoutes);
app.use("/users", userRoutes);
app.use("/reviews", reviewRoutes);
app.use("/orders", orderRoutes);
app.use("/errors", errorRoutes);
app.use("/", homeRoutes);

// 404 handler for undefined routes
app.all("*", handle404);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
