# Fear City Cycles Backend API

Complete Node.js/Express backend for Fear City Cycles e-commerce platform with Square payment integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Square developer account

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Database setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npm run seed
```

4. **Start development server**
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Square API
- **Authentication**: JWT (ready for implementation)
- **Email**: Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting

### Project Structure
```
backend/
├── routes/           # API route handlers
│   ├── products.js   # Product management
│   ├── orders.js     # Order processing
│   ├── payments.js   # Square payment integration
│   ├── cart.js       # Shopping cart operations
│   ├── contact.js    # Contact form handling
│   ├── customers.js  # Customer management
│   ├── admin.js      # Admin dashboard APIs
│   └── webhooks/     # Payment webhooks
├── prisma/           # Database schema and migrations
├── scripts/          # Database seeding and utilities
├── server.js         # Main application entry point
└── package.json      # Dependencies and scripts
```

## 🔌 API Endpoints

### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/:slug` - Get product by slug
- `GET /api/products/:id/related` - Get related products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/number/:orderNumber` - Get order by number
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Payments (Square Integration)
- `POST /api/payments/process` - Process payment
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/:paymentId` - Get payment details
- `POST /api/payments/create-customer` - Create Square customer

### Cart
- `GET /api/cart/:customerId` - Get customer cart
- `POST /api/cart/:customerId/items` - Add item to cart
- `PUT /api/cart/:customerId/items/:itemId` - Update cart item
- `DELETE /api/cart/:customerId/items/:itemId` - Remove cart item

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact/submissions` - List submissions (Admin)
- `PUT /api/contact/submissions/:id` - Update submission (Admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/orders` - List orders with advanced filtering
- `GET /api/admin/inventory` - Inventory management
- `PUT /api/admin/inventory/:productId` - Update inventory

## 💳 Square Payment Integration

### Setup
1. Create Square developer account
2. Get Application ID and Access Token
3. Configure webhook endpoint for payment updates
4. Set environment variables:

```env
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=your-app-id
SQUARE_ACCESS_TOKEN=your-access-token
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-key
```

### Payment Flow
1. Frontend creates payment form with Square Web SDK
2. Square generates payment token
3. Backend processes payment via `/api/payments/process`
4. Square webhooks update payment status
5. Order status updated automatically

### Webhook Events Handled
- `payment.updated` - Payment status changes
- `order.updated` - Order modifications
- `refund.updated` - Refund processing

## 🗄️ Database Schema

### Core Entities
- **Products** - Motorcycles and gear with inventory tracking
- **Categories** - Product categorization (Motorcycles, Gear)
- **Customers** - Customer profiles and Square integration
- **Orders** - Order management with Square order tracking
- **Cart** - Persistent shopping cart for logged-in users
- **Addresses** - Customer shipping/billing addresses
- **Contact Submissions** - Contact form entries
- **Admin Users** - Administrative access

### Key Features
- **Inventory Tracking** - Automatic stock updates on purchases
- **Square Integration** - Customer, order, and payment sync
- **Order Management** - Complete fulfillment workflow
- **Contact System** - Inquiry tracking and response management

## 🔐 Security Features

### Implemented
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **Input Validation** - express-validator for all inputs
- **SQL Injection Protection** - Prisma ORM parameterized queries
- **Webhook Verification** - Square signature validation

### Authentication (Ready for Implementation)
- JWT token structure prepared
- Password hashing with bcrypt
- Admin user roles defined
- Route protection middleware ready

## 📧 Email Integration

### Nodemailer Setup
- Contact form submissions send admin notifications
- Customer confirmation emails
- Order status update notifications (ready)

### Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🧪 Development

### Available Scripts
```bash
npm run dev        # Start development server with nodemon
npm start          # Start production server
npm run seed       # Seed database with sample data
npm run migrate    # Run database migrations
npm test           # Run tests (when implemented)
npm run lint       # Code linting
```

### Sample Data
The seed script creates:
- 6 motorcycles with specifications
- 3 gear items
- Product categories
- Admin user (`admin@fearcitycycles.com` - password will be generated or use ADMIN_PASSWORD env var)
- Site settings

### Testing Payments
Use Square's test card numbers in sandbox mode:
- **Success**: 4111 1111 1111 1111
- **Decline**: 4000 0000 0000 0002
- **CVV Failure**: Use CVV 999

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=your-production-token
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use production Square credentials
- [ ] Configure SSL/HTTPS
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Set up webhook endpoints
- [ ] Test payment processing

## 🔧 Configuration

### Default Settings
- **Tax Rate**: 8.25% (NYC)
- **Free Shipping**: Orders over $500
- **Default Shipping**: $50
- **Rate Limiting**: 100 requests per 15 minutes

### Customization
Update settings via database or admin API:
```sql
UPDATE settings SET value = '"new_value"' WHERE key = 'setting_key';
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logging
- Error logging to console
- Square webhook events logged
- Payment processing steps tracked

## 🤝 Integration with Frontend

### CORS Configuration
Backend configured to accept requests from:
- `http://localhost:8000` (development)
- Production frontend URL (set via `FRONTEND_URL`)

### Data Format
All API responses follow consistent format:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... },
  "error": "Error message if failed"
}
```

---

**Queens, NYC - Ride or Die** 🏍️

For support: `admin@fearcitycycles.com`