# Synexis Clique

A full-stack e-commerce platform built with modern web technologies, featuring user authentication, product management, payment integration, and admin dashboard.

## Features

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components
- User authentication and profile management
- Product browsing and shopping cart
- Order management
- Responsive design

### Backend
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with Mongoose
- JWT authentication with access and refresh tokens
- eSewa payment gateway integration
- Cloudinary for image uploads
- Email notifications
- Admin dashboard with audit logging
- Rate limiting and security middleware

### Key Features
- Secure user authentication
- Product catalog with categories
- Shopping cart and checkout
- Payment processing with eSewa
- Order tracking and management
- Admin panel for content management
- Email notifications
- Image upload and management
- Audit logging and monitoring
- Rate limiting and security

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios for API calls
- React Hook Form
- Lucide React icons

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcryptjs
- nodemailer
- Cloudinary
- eSewa API
- Helmet
- CORS
- Rate limiting

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anantasharma510/clique.git
   cd clique
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.local.example .env.local  # If exists
   # Edit .env.local with your configuration
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ACCESS_TOKEN_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ESEWA_SECRET_KEY=your_esewa_secret
ESEWA_PRODUCT_CODE=your_product_code
ESEWA_SUCCESS_URL=http://localhost:3000/success
ESEWA_FAILURE_URL=http://localhost:3000/failure
ADMIN_EMAIL=admin@example.com
MONITORING_EMAIL=monitor@example.com
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ESEWA_PRODUCT_CODE=EPAYTEST
NEXT_PUBLIC_TEST_EMAIL=test@example.com
NEXT_PUBLIC_TEST_TOKEN=test_token
```

## Usage

1. Start the backend server
2. Start the frontend development server
3. Access the application at `http://localhost:3000`

## API Documentation

The backend provides RESTful APIs for:
- User authentication (/api/auth)
- Product management (/api/products)
- Order processing (/api/orders)
- Admin operations (/api/admin)
- Payment verification (/api/payment)

## Project Structure

```
clique/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── service/             # API services
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   ├── package.json
│   └── tailwind.config.ts
├── nginx-config.conf        # Nginx configuration
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.