# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Brand Voice & Target Audience

**Brand Identity**: Underground motorcycle culture inspired by NYC's 1975 "Fear City" survival guide
- **Voice**: Direct, uncompromising language with anti-establishment tone
- **Style**: Authentic NYC street attitude - focus on substance over style
- **Target**: Experienced motorcycle riders (25-45) who value authenticity over mainstream appeal
- **Tagline**: "Queens, NYC - Ride or Die"

## Current Architecture: Full-Stack E-Commerce Platform

**Version**: v0.1.6 (Production Ready with Culture/Blog Section)
**Architecture**: Full-stack application with frontend, backend, database, and cloud services
**Deployment**: Vercel (frontend + serverless functions) + Supabase (database + storage)

### Tech Stack Overview
- **Frontend**: HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript (ES6+) - Static site architecture
- **API Layer**: Next.js 14 App Router (for serverless API routes only, not React frontend)
- **Backend**: Node.js with Express.js server (separate from Next.js)
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Supabase Storage for assets
- **Authentication**: Supabase Auth (implemented via RLS)
- **Deployment**: Vercel with serverless functions
- **Testing**: Jest with TypeScript test suite
- **Security**: Row-Level Security (RLS) implementation

## Development Commands

### Frontend Development
```bash
# Static file server for HTML/CSS/JS development
python -m http.server 8000
# OR
npx http-server

# For API routes testing (Next.js serverless functions)
npm run dev  # Starts Next.js dev server

# Access at: http://localhost:8000 (static) or http://localhost:3000 (Next.js)
```

### Backend Development
```bash
# Navigate to backend directory
cd backend/

# Install dependencies
npm install

# Start development server
npm run dev

# Database operations
npx prisma migrate dev    # Run database migrations
npx prisma generate      # Generate Prisma client
npx prisma studio       # Open database browser
```

### Testing
```bash
# Run full test suite
npm test

# Run specific test categories
npm run test:rate-limit  # Rate limiting tests
npm run rls:test        # Row-Level Security tests (note: rls:test not test:rls)
npm run rls:coverage    # RLS coverage analysis

# Test with coverage
npm run test:coverage

# RLS verification commands
npm run rls:audit       # Audit RLS policies
npm run rls:validate    # Validate RLS implementation
```

### Production Deployment
```bash
# Deploy to Vercel (automatic on git push to main)
vercel --prod

# Manual deployment
vercel deploy --prod
```

### Database Management
```bash
# Supabase CLI commands
npx supabase start      # Start local Supabase
npx supabase stop       # Stop local Supabase
npx supabase db reset   # Reset database

# RLS verification
npm run verify-rls      # Check RLS coverage
```

## Architecture Deep Dive

### Hybrid Architecture Explanation

Fear City Cycles uses a **hybrid architecture** combining the best of static sites and modern serverless:

1. **Static Frontend**: Traditional HTML/CSS/JavaScript files for fast loading and SEO
2. **Next.js API Routes**: Modern serverless functions in `/app/api/` for dynamic features
3. **Separate Express Backend**: Full backend server in `/backend/` for complex operations
4. **Supabase Integration**: Database, storage, and auth services

**Why This Architecture?**
- **Performance**: Static HTML loads instantly
- **SEO**: Perfect search engine optimization
- **Scalability**: Serverless functions scale automatically  
- **Flexibility**: Can add React components when needed
- **Cost-Effective**: Minimal server costs

### Frontend Architecture

**Core Pages**:
- `index.html` - Gateway page with dramatic brand entrance
- `main.html` - Main e-commerce hub
- `bikes/` - Custom motorcycle showcase
- `gear/` - Apparel and gear catalog
- `culture/` - Blog and community content (NEW in v0.1.6)
- `contact/` - Multi-form contact system
- `cart/` - Shopping cart and checkout

**JavaScript Architecture**:
- `assets/js/main.js` - Core functionality and ShoppingCart class
- `assets/js/gateway.js` - Gateway page interactions
- `assets/js/contact.js` - EmailJS integration and form handling
- `assets/js/cart.js` - Cart-specific functionality
- `assets/js/culture.js` - Blog filtering, search, and interactions (NEW)

**CSS Architecture**:
- `assets/css/main.css` - Core styles and design system
- `assets/css/pages.css` - Page-specific styles (including blog styles)
- `assets/css/responsive.css` - Mobile/tablet responsive overrides
- `assets/css/product.css` - Product page specific styles

### Backend Architecture

**Location**: `/backend/` directory
**Framework**: Node.js with Express.js
**Database**: PostgreSQL via Supabase with Prisma ORM

**Key Files**:
- `server.js` - Main Express server
- `package.json` - Backend dependencies and scripts
- `prisma/schema.prisma` - Database schema definition
- `routes/` - API route handlers
- `vercel.json` - Vercel deployment configuration

**API Endpoints**:
- `/api/products` - Product management
- `/api/cart` - Cart operations
- `/api/orders` - Order processing
- `/api/contact` - Contact form submissions
- `/api/newsletter` - Newsletter signups
- `/api/payments` - Payment processing (Square integration)

### Database Architecture

**Provider**: Supabase (PostgreSQL)
**ORM**: Prisma
**Security**: Row-Level Security (RLS) implemented

**Core Tables**:
- `products` - Product catalog
- `customers` - User accounts
- `orders` - Order management
- `order_items` - Order line items
- `categories` - Product categorization
- `contact_submissions` - Contact form data
- `newsletter_subscribers` - Email list management

**RLS Implementation**:
- Comprehensive row-level security across all tables
- User isolation and data protection
- Automated RLS testing and verification
- Coverage tracking via `RLS-COVERAGE-ANALYSIS.md`

### Cloud Services Integration

**Supabase Services**:
- **Database**: PostgreSQL with real-time subscriptions
- **Storage**: Image and asset management
- **Auth**: User authentication (ready for implementation)
- **Edge Functions**: Serverless function hosting

**Vercel Integration**:
- **Frontend Hosting**: Static site deployment
- **Serverless Functions**: API endpoint hosting
- **Edge Network**: Global CDN distribution
- **Preview Deployments**: Branch-based testing

### Security Implementation

**Frontend Security**:
- XSS protection implemented
- HTTPS required for production
- Secure headers configuration
- Input validation and sanitization

**Backend Security**:
- Rate limiting implementation (`lib/rate-limit/`)
- SQL injection prevention via Prisma
- Environment variable management
- CORS configuration for API endpoints

**Database Security**:
- Row-Level Security (RLS) across all tables
- User-based data isolation
- Encrypted connections
- Backup and recovery procedures

## Testing Infrastructure

**Framework**: Jest with TypeScript support
**Location**: `__tests__/` directory
**Configuration**: `jest.config.js` and `jest.config.simple.js`

**Test Categories**:
- **Core Tests**: Basic functionality (`__tests__/basic.test.ts`)
- **Rate Limiting**: API rate limiting (`__tests__/rate-limit/`)
- **Security**: RLS and security features
- **Integration**: End-to-end API testing

**Test Commands**:
```bash
npm test                    # Full test suite
npm run test:simple        # Basic tests only
npm run test:rate-limit    # Rate limiting tests
npm run verify-rls         # RLS verification
```

## Content Management

### Product Management
- Products stored in database with Prisma ORM
- Asset management via Supabase Storage
- Real-time inventory tracking
- Category-based organization

### Blog/Culture Section (v0.1.6)
- Static content with dynamic features
- RSS feed generation (`culture/rss.xml`)
- Category filtering and search
- SEO optimization with Schema.org markup

### Contact System
- EmailJS integration for form submissions
- Multiple contact form types (custom, gear, press, general)
- Database storage of all submissions
- Automated email notifications

## Development Guidelines

### Code Style
- **ES6+ JavaScript**: Use modern JavaScript features
- **CSS**: Mobile-first responsive design
- **HTML**: Semantic HTML5 structure
- **TypeScript**: Used for testing and backend types

### Database Operations
```bash
# Make schema changes
npx prisma db push          # Push schema changes
npx prisma migrate dev      # Create and apply migration
npx prisma generate         # Regenerate Prisma client
```

### Environment Variables
```bash
# Required environment variables (.env)
DATABASE_URL=               # Supabase database URL
SUPABASE_URL=              # Supabase project URL
SUPABASE_ANON_KEY=         # Supabase anonymous key
EMAILJS_SERVICE_ID=        # EmailJS service ID
EMAILJS_TEMPLATE_ID=       # EmailJS template ID
EMAILJS_PUBLIC_KEY=        # EmailJS public key
```

### Asset Management
- **Images**: Stored in Supabase Storage
- **Asset Mapping**: `supabase-asset-mapping.json`
- **Optimization**: Automated image optimization
- **CDN**: Global distribution via Supabase CDN

## Common Tasks

### Adding New Products
1. Add product data via Prisma database operations
2. Upload product images to Supabase Storage
3. Update product pages with new items
4. Test cart functionality with new products

### Blog Content Updates
1. Create new HTML files in `/culture/` directory
2. Update RSS feed (`culture/rss.xml`)
3. Add to sitemap.xml for SEO
4. Test category filtering and search

### API Endpoint Development
1. Create route handler in `/backend/routes/`
2. Update Prisma schema if database changes needed
3. Add TypeScript types for request/response
4. Write tests in `__tests__/` directory
5. Update API documentation

### Deployment Process
1. Test locally with `npm test`
2. Verify RLS coverage with `npm run verify-rls`
3. Commit changes to main branch
4. Automatic Vercel deployment
5. Verify production deployment

## Monitoring and Analytics

### Performance Monitoring
- Core Web Vitals tracking
- Service Worker performance metrics
- Database query optimization
- Asset delivery monitoring

### Security Monitoring
- Rate limiting analytics
- RLS compliance verification
- Security header validation
- Automated vulnerability scanning

### Business Analytics
- Contact form submission tracking
- Cart abandonment analysis
- Product performance metrics
- Blog content engagement

## Documentation

### Required Documentation Files
- **PROJECT-STATUS.md** - Overall completion tracking
- **CHANGELOG.md** - Version history and features
- **TODO.md** - Task management and priorities
- **RLS-IMPLEMENTATION-GUIDE.md** - Security documentation
- **DEPLOYMENT-CHECKLIST.md** - Production deployment steps

### API Documentation
- RESTful API endpoints documented
- Request/response examples
- Authentication requirements
- Rate limiting information

## Important Notes

- **Full-Stack Application**: No longer a static site
- **Production Ready**: v0.1.6 with 99% completion
- **Scalable Architecture**: Designed for growth and expansion
- **Security First**: Comprehensive security implementation
- **Testing Coverage**: Automated testing across all components
- **Performance Optimized**: PWA capabilities with offline support
- **SEO Optimized**: Complete SEO implementation with structured data

## Future Roadmap

### v0.1.7 - User System Implementation
- User registration and authentication
- Order history and account management
- Payment processing integration
- Advanced user features

### v0.1.8 - Advanced Features
- Inventory management system
- Admin dashboard
- Advanced analytics
- Mobile app considerations

### v0.2.0 - Full Business Platform
- Multi-vendor support
- Advanced customization tools
- Enterprise features
- Community platform expansion