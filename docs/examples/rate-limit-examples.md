# Rate Limiting Examples

Practical examples for implementing rate limiting in the Fear City Cycles website.

## Table of Contents

- [Basic API Protection](#basic-api-protection)
- [Authentication Endpoints](#authentication-endpoints)
- [Contact Form Protection](#contact-form-protection)
- [E-commerce Endpoints](#e-commerce-endpoints)
- [Advanced Patterns](#advanced-patterns)
- [Custom Configurations](#custom-configurations)
- [Error Handling](#error-handling)
- [Testing Examples](#testing-examples)

## Basic API Protection

### Simple Rate Limiting

```typescript
// app/api/products/route.ts
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

export async function GET(request: Request) {
  // Apply default rate limiting
  const rateLimitResult = await checkRateLimit(request);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  // Fetch products
  const products = await getProducts();
  return Response.json(products);
}
```

### With Custom Limits

```typescript
// app/api/search/route.ts
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  // Custom limits for search API
  const rateLimitResult = await checkRateLimit(request, {
    customLimits: [
      { interval: 1000, limit: 2 },     // 2 per second (burst)
      { interval: 60000, limit: 30 },   // 30 per minute
      { interval: 3600000, limit: 200 } // 200 per hour
    ]
  });
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  const { query } = await request.json();
  const results = await searchProducts(query);
  return Response.json(results);
}
```

## Authentication Endpoints

### Login Protection

```typescript
// app/api/auth/login/route.ts
import { checkAuthRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  // Strict rate limiting for login attempts
  const rateLimitResult = await checkAuthRateLimit(request);
  
  if (!rateLimitResult.success) {
    // Include CAPTCHA challenge if needed
    if (rateLimitResult.captchaRequired) {
      return Response.json({
        error: 'Rate limit exceeded',
        captcha: rateLimitResult.captchaChallenge
      }, { 
        status: 429,
        headers: rateLimitResult.headers 
      });
    }
    return rateLimitResult.response;
  }
  
  // Process login
  const { email, password } = await request.json();
  const user = await authenticateUser(email, password);
  
  if (!user) {
    // Failed login - this contributes to rate limiting
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  return Response.json({ user });
}
```

### Registration with CAPTCHA

```typescript
// app/api/auth/register/route.ts
import { checkAuthRateLimit } from '@/lib/rate-limit/api-integration';
import { securityManager } from '@/lib/rate-limit/security';

export async function POST(request: Request) {
  const rateLimitResult = await checkAuthRateLimit(request, {
    enableCaptcha: true
  });
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  const { email, password, captchaId, captchaSolution } = await request.json();
  
  // Verify CAPTCHA if provided
  if (captchaId && captchaSolution) {
    const captchaResult = await securityManager.verifyCaptchaSolution(
      captchaId, 
      captchaSolution
    );
    
    if (!captchaResult.valid) {
      return Response.json({ 
        error: 'Invalid CAPTCHA' 
      }, { status: 400 });
    }
  }
  
  // Create user account
  const user = await createUser(email, password);
  return Response.json({ user });
}
```

## Contact Form Protection

### Spam Prevention

```typescript
// app/api/contact/route.ts
import { checkContactRateLimit } from '@/lib/rate-limit/api-integration';
import { securityManager } from '@/lib/rate-limit/security';

export async function POST(request: Request) {
  // Very strict limits for contact form
  const rateLimitResult = await checkContactRateLimit(request);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  const { name, email, message } = await request.json();
  
  // Additional bot detection
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  
  const botCheck = securityManager.detectBotPatterns({
    userAgent,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  if (botCheck.isBot && botCheck.confidence > 0.7) {
    return Response.json({ 
      error: 'Automated requests not allowed' 
    }, { status: 403 });
  }
  
  // Send email
  await sendContactEmail({ name, email, message });
  return Response.json({ success: true });
}
```

## E-commerce Endpoints

### Shopping Cart Operations

```typescript
// app/api/cart/add/route.ts
import { checkApiRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  // Get user tier from session/JWT
  const userTier = await getUserTier(request);
  
  const rateLimitResult = await checkApiRateLimit(request, userTier);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  const { productId, quantity } = await request.json();
  const result = await addToCart(productId, quantity);
  
  return Response.json(result);
}
```

### Payment Processing

```typescript
// app/api/payments/process/route.ts
import { checkPaymentRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  // Extremely strict limits for payments
  const rateLimitResult = await checkPaymentRateLimit(request);
  
  if (!rateLimitResult.success) {
    // Log payment rate limit violations for security monitoring
    console.warn('Payment rate limit violation:', {
      ip: request.headers.get('x-forwarded-for'),
      timestamp: new Date().toISOString()
    });
    
    return rateLimitResult.response;
  }
  
  // Process payment with additional security
  const result = await processPayment(request);
  return Response.json(result);
}
```

## Advanced Patterns

### Decorator Pattern

```typescript
// app/api/premium/feature/route.ts
import { withRateLimit } from '@/lib/rate-limit/api-integration';

// Automatic rate limiting with custom configuration
export const POST = withRateLimit({
  customLimits: [
    { interval: 60000, limit: 50 }  // Premium users get higher limits
  ],
  userTier: 'premium',
  enableCaptcha: false
})(async (request: Request) => {
  // Your API logic here - rate limiting is handled automatically
  const data = await request.json();
  const result = await processPremiumFeature(data);
  return Response.json(result);
});
```

### Bulk Operations

```typescript
// app/api/bulk/upload/route.ts
import { checkBulkOperationRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  const { operations } = await request.json();
  const operationCount = operations.length;
  
  // Rate limiting based on operation count
  const rateLimitResult = await checkBulkOperationRateLimit(
    request, 
    operationCount
  );
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  const results = await processBulkOperations(operations);
  return Response.json(results);
}
```

### File Upload with Size Limits

```typescript
// app/api/upload/route.ts
import { checkUploadRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Rate limiting based on file size
  const rateLimitResult = await checkUploadRateLimit(request, file.size);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  const uploadResult = await uploadFile(file);
  return Response.json(uploadResult);
}
```

## Custom Configurations

### Time-based Restrictions

```typescript
// app/api/orders/route.ts
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  const hour = new Date().getHours();
  
  // Stricter limits during business hours
  const limits = hour >= 9 && hour <= 17 ? [
    { interval: 60000, limit: 10 }   // Business hours: 10/min
  ] : [
    { interval: 60000, limit: 5 }    // Off hours: 5/min
  ];
  
  const rateLimitResult = await checkRateLimit(request, {
    customLimits: limits
  });
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  // Process order
  const order = await createOrder(request);
  return Response.json(order);
}
```

### Geographic Restrictions

```typescript
// app/api/restricted/route.ts
import { checkGeoRateLimit } from '@/lib/rate-limit/api-integration';

export async function GET(request: Request) {
  // Get country code from headers (set by CDN/proxy)
  const countryCode = request.headers.get('cf-ipcountry') || 'unknown';
  
  const rateLimitResult = await checkGeoRateLimit(request, countryCode);
  
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }
  
  const data = await getRestrictedData();
  return Response.json(data);
}
```

## Error Handling

### Graceful Degradation

```typescript
// app/api/resilient/route.ts
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

export async function GET(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(request);
    
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }
    
    const data = await getData();
    return Response.json(data);
    
  } catch (error) {
    // Log the error but don't block the request
    console.error('Rate limiting error:', error);
    
    // Proceed with request (fail open)
    const data = await getData();
    return Response.json(data, {
      headers: {
        'X-RateLimit-Status': 'error',
        'X-RateLimit-Fallback': 'true'
      }
    });
  }
}
```

### Custom Error Responses

```typescript
// app/api/custom-errors/route.ts
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimit(request);
  
  if (!rateLimitResult.success) {
    // Custom error response for this endpoint
    return Response.json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait before trying again.',
        retryAfter: rateLimitResult.headers['Retry-After'],
        suggestions: [
          'Wait for the rate limit to reset',
          'Consider upgrading your account for higher limits',
          'Contact support if you believe this is an error'
        ]
      }
    }, {
      status: 429,
      headers: rateLimitResult.headers
    });
  }
  
  // Normal processing
  const result = await processRequest(request);
  return Response.json(result);
}
```

## Testing Examples

### Unit Testing API Routes

```typescript
// __tests__/api/products.test.ts
import { GET } from '@/app/api/products/route';
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

// Mock the rate limiting
jest.mock('@/lib/rate-limit/api-integration', () => ({
  checkRateLimit: jest.fn(),
}));

describe('/api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return products when rate limit allows', async () => {
    // Mock successful rate limit check
    (checkRateLimit as jest.Mock).mockResolvedValue({
      success: true,
      headers: {}
    });

    const request = new Request('http://localhost/api/products');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('products');
  });

  it('should return 429 when rate limited', async () => {
    // Mock rate limit exceeded
    (checkRateLimit as jest.Mock).mockResolvedValue({
      success: false,
      response: new Response('Rate limit exceeded', { status: 429 })
    });

    const request = new Request('http://localhost/api/products');
    const response = await GET(request);

    expect(response.status).toBe(429);
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/rate-limiting.test.ts
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit/api-integration';

describe('Rate Limiting Integration', () => {
  it('should enforce limits across multiple requests', async () => {
    const requests = Array(15).fill(0).map(() => 
      new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.100' }
      })
    );

    const results = [];
    for (const request of requests) {
      const result = await checkRateLimit(request, {
        customLimits: [{ interval: 60000, limit: 10 }]
      });
      results.push(result.success);
    }

    // First 10 should succeed, last 5 should fail
    const successCount = results.filter(Boolean).length;
    expect(successCount).toBe(10);
  });
});
```

### Load Testing

```typescript
// scripts/load-test.ts
async function loadTest() {
  const endpoint = 'http://localhost:3000/api/test';
  const concurrentRequests = 100;
  const totalRequests = 1000;

  console.log(`Starting load test: ${totalRequests} requests with ${concurrentRequests} concurrent`);

  for (let batch = 0; batch < totalRequests / concurrentRequests; batch++) {
    const promises = Array(concurrentRequests).fill(0).map(async () => {
      const response = await fetch(endpoint);
      return {
        status: response.status,
        rateLimited: response.status === 429
      };
    });

    const results = await Promise.all(promises);
    const rateLimited = results.filter(r => r.rateLimited).length;
    
    console.log(`Batch ${batch + 1}: ${rateLimited}/${concurrentRequests} rate limited`);
    
    // Wait between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Run: npx tsx scripts/load-test.ts
loadTest().catch(console.error);
```

## Configuration Examples

### Development Environment

```typescript
// config/rate-limit.dev.ts
export const devRateLimitConfig = {
  global: {
    enabled: true,
    defaultRule: {
      windows: [
        { interval: 60000, limit: 1000 }  // Generous limits for development
      ]
    }
  },
  security: {
    exponentialBackoff: {
      enabled: false  // Disable for easier testing
    },
    captcha: {
      enabled: false  // Disable CAPTCHA in development
    }
  }
};
```

### Production Environment

```typescript
// config/rate-limit.prod.ts
export const prodRateLimitConfig = {
  global: {
    enabled: true,
    defaultRule: {
      windows: [
        { interval: 1000, limit: 10 },     // 10 per second
        { interval: 60000, limit: 100 },   // 100 per minute
        { interval: 3600000, limit: 1000 } // 1000 per hour
      ]
    }
  },
  security: {
    exponentialBackoff: {
      enabled: true,
      multiplier: 2,
      maxDelay: 300000
    },
    captcha: {
      enabled: true,
      threshold: 5
    }
  }
};
```

---

These examples demonstrate practical implementations of the rate limiting system for various scenarios in the Fear City Cycles website. Adapt them based on your specific requirements and traffic patterns.