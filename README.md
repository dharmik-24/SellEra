# 🛍️ SellEra - Multi-Vendor E-Commerce Platform

A modern, full-featured e-commerce marketplace built with Node.js, Express, and MongoDB. SellEra connects buyers with multiple vendors in a seamless shopping experience.


## ✨ Features

### 🛒 For Customers
- **Product Discovery**: Browse products by categories, search, and filter
- **Shopping Cart**: Add products, manage quantities, and secure checkout
- **User Accounts**: Registration, login, and profile management
- **Order Tracking**: Real-time order status updates
- **Reviews & Ratings**: Rate products and read customer feedback
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### 🏪 For Vendors
- **Vendor Dashboard**: Comprehensive analytics and sales insights
- **Product Management**: Add, edit, and manage product inventory
- **Order Management**: Track and fulfill customer orders
- **Image Upload**: Multiple product images with Cloudinary integration
- **Sales Analytics**: Revenue tracking and performance metrics

### 🔧 Technical Features
- **Authentication**: Secure JWT-based authentication system
- **Image Handling**: Cloudinary integration for optimized image storage
- **Database**: MongoDB with Mongoose ODM
- **Responsive UI**: Tailwind CSS with modern design patterns
- **Error Handling**: Comprehensive error pages and validation
- **Session Management**: Secure session handling with express-session

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sellera.git
   cd sellera
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sellera
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   PORT=3000
   ```

4. **Start the application**
   ```bash
   # Development mode (with CSS watching)
   npm run dev

   # Production mode
   npm start
   ```

5. **Seed the database (optional)**
   ```bash
   node seeds.js
   ```

Visit `http://localhost:3000` to see the application running!

## 📁 Project Structure

```
sellera/
├── controllers/           # Route controllers
│   ├── productController.js
│   ├── userController.js
│   └── vendorController.js
├── middleware/           # Custom middleware
│   ├── auth.js
│   ├── upload.js
│   └── validation.js
├── models/              # Database schemas
│   ├── ProductSchema.js
│   ├── UserSchema.js
│   ├── VendorSchema.js
│   └── OrderSchema.js
├── routes/              # Express routes
│   ├── homeRoutes.js
│   ├── productsRoutes.js
│   ├── userRoutes.js
│   └── vendorRoutes.js
├── views/               # EJS templates
│   ├── partials/
│   ├── products/
│   ├── vendors/
│   └── errors/
├── public/              # Static assets
│   ├── stylesheets/
│   ├── images/
│   └── js/
├── scripts/             # Utility scripts
└── index.js            # Application entry point
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File upload handling
- **Cloudinary** - Image storage and optimization

### Frontend
- **EJS** - Template engine
- **Tailwind CSS** - Utility-first CSS framework
- **Remix Icons** - Icon library
- **Vanilla JavaScript** - Client-side interactions

### Tools & Services
- **Nodemon** - Development server
- **dotenv** - Environment variables
- **Express Session** - Session management
- **Cookie Parser** - Cookie handling

## 🎯 API Endpoints

### Products
```
GET    /products              # Get all products
GET    /products/new          # New product form (vendors only)
GET    /products/:id          # Get product details
POST   /products              # Create new product
PATCH  /products/:id          # Update product
DELETE /products/:id          # Delete product
GET    /products/category/:category  # Get products by category
```

### Users
```
GET    /users/register        # Registration form
POST   /users/register        # Create user account
GET    /users/login           # Login form
POST   /users/login           # Authenticate user
POST   /users/logout          # Logout user
```

### Vendors
```
GET    /vendors/register      # Vendor registration
POST   /vendors/register      # Create vendor account
GET    /vendors/dashboard     # Vendor dashboard
GET    /vendors/products      # Vendor products management
GET    /vendors/orders        # Vendor orders management
```

## 🎨 UI Components

### Design System
- **Primary Colors**: Indigo/Blue gradient theme
- **Typography**: Modern, readable font stack
- **Spacing**: Consistent 8px grid system
- **Components**: Reusable card, button, and form components
- **Animations**: Smooth transitions and hover effects

### Key Pages
- **Homepage**: Hero section with featured products
- **Product Listing**: Grid layout with filters and search
- **Product Details**: Image gallery, reviews, and purchase options
- **Vendor Dashboard**: Analytics, product management, and orders
- **Error Pages**: Custom 404 and error handling pages

## 🔒 Security Features

- **Authentication**: JWT-based secure authentication
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Server-side validation for all forms
- **File Upload Security**: Restricted file types and sizes
- **Session Security**: Secure session configuration
- **CORS Protection**: Cross-origin request handling

## 📱 Responsive Design

SellEra is fully responsive and optimized for:
- **Desktop**: Full-featured experience with sidebar navigation
- **Tablet**: Adapted layouts with touch-friendly interfaces
- **Mobile**: Optimized mobile experience with bottom navigation

## 🚀 Deployment

### Heroku Deployment
```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
# ... other environment variables

# Deploy
git push heroku main
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sellera
JWT_SECRET=your_super_secure_jwt_secret
SESSION_SECRET=your_super_secure_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## 🧪 Testing

Run the dashboard statistics test:
```bash
node testDashboardStats.js
```

## 📝 Scripts

```bash
npm run dev              # Development with CSS watching
npm run build-css        # Build CSS with Tailwind (watch mode)
npm run build-css-prod   # Build CSS for production (minified)
npm start               # Production start
npm run migrate-cloudinary  # Migrate images to Cloudinary
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Dharmik Kansara** -  [ParthChauhan09](https://github.com/ParthChauhan09)

## 🙏 Acknowledgments

- Tailwind CSS for the amazing utility-first CSS framework
- Cloudinary for image storage and optimization
- MongoDB for the flexible database solution
- Express.js community for the robust web framework

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact: dharmikkansara24@gmail.com

---
