# Fear City Cycles API Reference

Complete API documentation for the Fear City Cycles backend (v0.1.7).

## Base URL

```
Development: http://localhost:3001
Production: https://api.fearcitycycles.com (to be deployed)
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... },  // For paginated endpoints
  "error": "Error message if failed"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
```
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-07-02T00:00:00Z"
  }
}
```

---

### Products

#### List Products
```http
GET /api/products
```

**Query Parameters:**
- `category` (string) - Filter by category slug
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `search` (string) - Search in name and description
- `featured` (boolean) - Show only featured products
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20, max: 100)
- `sortBy` (string) - Sort field: `name`, `price`, `created`, `featured`
- `sortOrder` (string) - Sort order: `asc`, `desc`

**Example:**
```
GET /api/products?category=motorcycles&minPrice=20000&maxPrice=30000&sortBy=price&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Street Reaper",
      "slug": "street-reaper",
      "description": "Stripped-down street fighter...",
      "price": 24500,
      "image": "/images/bike-001.png",
      "category": {
        "id": 1,
        "name": "Motorcycles",
        "slug": "motorcycles"
      },
      "specifications": {
        "engine": "1000cc Twin",
        "power": "120hp",
        "weight": "420lbs"
      },
      "inventory": 5,
      "featured": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 6,
    "totalPages": 1
  }
}
```

#### Get Single Product
```http
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Street Reaper",
    "slug": "street-reaper",
    "description": "Stripped-down street fighter...",
    "price": 24500,
    "images": [
      "/images/bike-001.png",
      "/images/bike-001-2.png"
    ],
    "category": {
      "id": 1,
      "name": "Motorcycles",
      "slug": "motorcycles"
    },
    "specifications": {
      "engine": "1000cc Twin",
      "power": "120hp",
      "weight": "420lbs",
      "topSpeed": "155mph",
      "torque": "85 lb-ft"
    },
    "inventory": 5,
    "featured": true,
    "variants": [
      {
        "id": 1,
        "name": "Matte Black",
        "priceModifier": 0
      },
      {
        "id": 2,
        "name": "Chrome Edition",
        "priceModifier": 500
      }
    ]
  }
}
```

#### Get Related Products
```http
GET /api/products/:id/related
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Borough Bruiser",
      "slug": "borough-bruiser",
      "price": 28000,
      "image": "/images/bike-002.png"
    }
  ]
}
```

---

### Shopping Cart

#### Get Cart
```http
GET /api/cart
```
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "Street Reaper",
          "price": 24500,
          "image": "/images/bike-001.png"
        },
        "quantity": 1,
        "variant": "Matte Black",
        "customOptions": {
          "exhaust": "Vance & Hines",
          "seat": "Solo Seat"
        },
        "subtotal": 24500
      }
    ],
    "subtotal": 24500,
    "tax": 2021.25,
    "shipping": 0,
    "total": 26521.25
  }
}
```

#### Add to Cart
```http
POST /api/cart
```
*Requires authentication*

**Body:**
```json
{
  "productId": 1,
  "quantity": 1,
  "variant": "Matte Black",
  "customOptions": {
    "exhaust": "Vance & Hines",
    "seat": "Solo Seat"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cartItem": {
      "id": 1,
      "productId": 1,
      "quantity": 1,
      "variant": "Matte Black"
    }
  }
}
```

#### Update Cart Item
```http
PUT /api/cart/:itemId
```
*Requires authentication*

**Body:**
```json
{
  "quantity": 2
}
```

#### Remove from Cart
```http
DELETE /api/cart/:itemId
```
*Requires authentication*

#### Clear Cart
```http
DELETE /api/cart
```
*Requires authentication*

---

### Orders

#### Create Order
```http
POST /api/orders
```
*Requires authentication*

**Body:**
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Queens",
    "state": "NY",
    "zip": "11101",
    "country": "US"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Queens",
    "state": "NY",
    "zip": "11101",
    "country": "US"
  },
  "paymentToken": "cnon:card-nonce-from-square",
  "saveCard": true  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "FCC-2025-0001",
      "status": "processing",
      "total": 26521.25,
      "createdAt": "2025-07-02T00:00:00Z"
    },
    "payment": {
      "id": "square-payment-id",
      "status": "completed",
      "amount": 26521.25
    }
  }
}
```

#### Get User Orders
```http
GET /api/orders
```
*Requires authentication*

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `status` (string) - Filter by status: `pending`, `processing`, `shipped`, `delivered`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "FCC-2025-0001",
      "status": "processing",
      "total": 26521.25,
      "itemCount": 1,
      "createdAt": "2025-07-02T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Get Order Details
```http
GET /api/orders/:id
```
*Requires authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "FCC-2025-0001",
    "status": "processing",
    "items": [
      {
        "id": 1,
        "product": {
          "name": "Street Reaper",
          "image": "/images/bike-001.png"
        },
        "quantity": 1,
        "price": 24500,
        "variant": "Matte Black",
        "subtotal": 24500
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Queens",
      "state": "NY",
      "zip": "11101"
    },
    "billingAddress": {
      "street": "123 Main St",
      "city": "Queens",
      "state": "NY",
      "zip": "11101"
    },
    "subtotal": 24500,
    "tax": 2021.25,
    "shipping": 0,
    "total": 26521.25,
    "payment": {
      "method": "card",
      "last4": "1111",
      "brand": "VISA"
    },
    "createdAt": "2025-07-02T00:00:00Z",
    "updatedAt": "2025-07-02T00:00:00Z"
  }
}
```

---

### Payments

#### Process Payment
```http
POST /api/payments/process
```
*Requires authentication*

**Body:**
```json
{
  "orderId": 1,
  "paymentToken": "cnon:card-nonce-from-square",
  "amount": 26521.25,
  "saveCard": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "square-payment-id",
    "status": "completed",
    "receiptUrl": "https://squareup.com/receipt/...",
    "last4": "1111",
    "brand": "VISA"
  }
}
```

---

### Contact

#### Submit Contact Form
```http
POST /api/contact
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",  // Optional
  "type": "GENERAL",  // GENERAL, CUSTOM, GEAR, PRESS
  "message": "I'm interested in custom builds...",
  "bikeModel": "Street Reaper"  // For CUSTOM type
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "message": "Thank you for contacting us. We'll respond within 24 hours."
  }
}
```

---

### Newsletter

#### Subscribe to Newsletter
```http
POST /api/newsletter
```

**Body:**
```json
{
  "email": "subscriber@example.com",
  "source": "footer"  // Optional: footer, popup, blog
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully subscribed to newsletter"
  }
}
```

---

### Categories

#### List Categories
```http
GET /api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Motorcycles",
      "slug": "motorcycles",
      "description": "Custom bikes built for NYC streets",
      "productCount": 6
    },
    {
      "id": 2,
      "name": "Gear",
      "slug": "gear",
      "description": "Riding gear and apparel",
      "productCount": 3
    }
  ]
}
```

---

### Admin Endpoints

All admin endpoints require authentication with an admin account.

#### Dashboard Statistics
```http
GET /api/admin/dashboard
```
*Requires admin authentication*

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": {
      "total": 150,
      "pending": 5,
      "processing": 10,
      "shipped": 20,
      "delivered": 115
    },
    "revenue": {
      "total": 4250000,
      "thisMonth": 350000,
      "lastMonth": 280000
    },
    "products": {
      "total": 9,
      "lowStock": 2,
      "outOfStock": 0
    },
    "customers": {
      "total": 125,
      "newThisMonth": 15
    }
  }
}
```

#### Update Order Status
```http
PUT /api/admin/orders/:id/status
```
*Requires admin authentication*

**Body:**
```json
{
  "status": "shipped",
  "trackingNumber": "1Z999AA10123456784",  // Optional
  "notes": "Shipped via FedEx"  // Optional
}
```

#### Update Inventory
```http
PUT /api/admin/inventory/:productId
```
*Requires admin authentication*

**Body:**
```json
{
  "inventory": 10,
  "operation": "set"  // set, add, subtract
}
```

---

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Authentication Errors
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid token or session expired"
}
```

### Rate Limiting
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 15 minutes.",
  "retryAfter": 900
}
```

---

## Webhooks

### Square Payment Webhooks

Configure webhook endpoint: `https://api.fearcitycycles.com/webhooks/square`

#### Payment Updated
```json
{
  "type": "payment.updated",
  "data": {
    "object": {
      "payment": {
        "id": "payment-id",
        "status": "COMPLETED",
        "amount_money": {
          "amount": 26521,
          "currency": "USD"
        }
      }
    }
  }
}
```

---

## Testing

### Test Cards (Square Sandbox)

| Card Number | Result |
|-------------|---------|
| 4111 1111 1111 1111 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 0010 | Insufficient Funds |
| Any card with CVV 999 | CVV Failure |

### Test Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test with token
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Rate Limits

- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Payment endpoints**: 10 requests per 15 minutes per user

---

## Support

For API support or issues:
- Email: admin@fearcitycycles.com
- Documentation: https://github.com/fearcitycycles/api-docs

---

*Last Updated: 2025-07-02*  
*API Version: 0.1.7*