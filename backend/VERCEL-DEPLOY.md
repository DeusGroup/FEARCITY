# 🚀 Vercel Deployment Guide - Fear City Cycles Backend

Complete guide to deploy the Fear City Cycles backend API to Vercel with PostgreSQL database.

## 📋 Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** - Install globally
3. **PostgreSQL Database** - We'll use Vercel Postgres or external provider
4. **Square Developer Account** - For payment processing

## 🛠️ Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## 🔑 Step 2: Login to Vercel

```bash
cd backend
vercel login
```

Follow the authentication prompts.

## 🗄️ Step 3: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. **Create Vercel Postgres database:**
```bash
vercel postgres create fear-city-db
```

2. **Get connection string:**
```bash
vercel postgres show fear-city-db
```
Copy the `POSTGRES_PRISMA_URL` for the next step.

### Option B: External PostgreSQL (Alternative)

Use any PostgreSQL provider like:
- **Supabase** (free tier)
- **PlanetScale** (MySQL alternative)
- **ElephantSQL** (PostgreSQL)
- **Neon** (serverless PostgreSQL)

## ⚙️ Step 4: Configure Environment Variables

Create environment variables in Vercel:

```bash
# Set up all environment variables
vercel env add NODE_ENV
# Enter: production

vercel env add DATABASE_URL
# Enter your PostgreSQL connection string

vercel env add JWT_SECRET
# Enter: your-super-secret-jwt-key-change-this-in-production

# Square API Configuration
vercel env add SQUARE_ENVIRONMENT
# Enter: sandbox (or production for live)

vercel env add SQUARE_APPLICATION_ID
# Enter: your-square-application-id

vercel env add SQUARE_ACCESS_TOKEN
# Enter: your-square-access-token

vercel env add SQUARE_WEBHOOK_SIGNATURE_KEY
# Enter: your-webhook-signature-key

vercel env add SQUARE_LOCATION_ID
# Enter: your-square-location-id

# Email Configuration
vercel env add SMTP_HOST
# Enter: smtp.gmail.com

vercel env add SMTP_PORT
# Enter: 587

vercel env add SMTP_USER
# Enter: your-email@gmail.com

vercel env add SMTP_PASS
# Enter: your-app-password

vercel env add FROM_EMAIL
# Enter: noreply@fearcitycycles.com

vercel env add FROM_NAME
# Enter: Fear City Cycles

vercel env add FRONTEND_URL
# Enter: https://deusgroup.github.io/FEARCITY

vercel env add ADMIN_EMAIL
# Enter: admin@fearcitycycles.com
```

## 🔧 Step 5: Initialize Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npx prisma db seed
```

## 🚀 Step 6: Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Link to existing project?** No (unless you have one)
- **Project name?** fear-city-cycles-backend
- **Directory?** ./ (current directory)
- **Override settings?** No

## ✅ Step 7: Verify Deployment

After deployment, test your endpoints:

```bash
# Get your deployment URL from Vercel output
# Test health endpoint
curl https://your-app.vercel.app/health

# Test products endpoint
curl https://your-app.vercel.app/api/products
```

## 🔄 Step 8: Set Up Database (Post-Deployment)

If you need to run migrations on the deployed database:

```bash
# Run migrations on production database
vercel env pull .env.local
npx prisma migrate deploy

# Seed the database
npx prisma db seed
```

## 🎯 Step 9: Configure Square Webhooks

1. **Go to Square Developer Dashboard**
2. **Navigate to Webhooks**
3. **Add webhook endpoint:**
   - URL: `https://your-app.vercel.app/webhooks/square`
   - Events: `payment.updated`, `order.updated`, `refund.updated`

## 🔧 Step 10: Update Frontend CORS

Update your frontend to call the new backend:

```javascript
// In your frontend JavaScript files, replace:
const API_BASE = 'http://localhost:3001'; // Development

// With:
const API_BASE = 'https://your-app.vercel.app'; // Production
```

## 📊 Step 11: Monitor & Test

### Test Core Functionality:
```bash
# Health check
curl https://your-app.vercel.app/health

# Get products
curl https://your-app.vercel.app/api/products

# Get categories
curl https://your-app.vercel.app/api/categories

# Test contact form
curl -X POST https://your-app.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "type": "GENERAL",
    "message": "Test message"
  }'
```

## 🔄 Continuous Deployment

### Automatic Deployments:
1. **Connect GitHub repository** to Vercel project
2. **Enable auto-deployments** on push to main branch
3. **Set up preview deployments** for pull requests

```bash
# Link to GitHub repository
vercel --prod --confirm
```

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   ```bash
   # Check database URL format
   vercel env ls
   # Ensure PRISMA_URL is properly formatted
   ```

2. **Prisma Generation Fails**
   ```bash
   # Clear Prisma cache
   npx prisma generate --force
   ```

3. **CORS Errors**
   ```bash
   # Verify FRONTEND_URL environment variable
   vercel env get FRONTEND_URL
   ```

4. **Square API Errors**
   ```bash
   # Verify all Square environment variables are set
   vercel env ls | grep SQUARE
   ```

### View Logs:
```bash
# Real-time logs
vercel logs --follow

# Function logs
vercel logs --since=1h
```

## 📈 Performance Optimization

### Vercel Configuration:
- **Function timeout**: 30 seconds (configured)
- **Memory**: Default (1024MB)
- **Regions**: Automatic (optimize for your users)

### Database Optimization:
```javascript
// Connection pooling in production
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

## 🔐 Security Checklist

- ✅ Environment variables secure
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ SQL injection protection (Prisma)
- ✅ Input validation (express-validator)
- ✅ Webhook signature verification

## 🎯 Next Steps

1. **Update frontend** to use new backend URLs
2. **Test payment processing** with Square sandbox
3. **Set up monitoring** (Vercel Analytics)
4. **Configure custom domain** (optional)
5. **Set up backup strategy** for database

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
- **Square API**: [developer.squareup.com](https://developer.squareup.com)

---

**Deployment URL**: https://your-app.vercel.app
**GitHub Pages Frontend**: https://deusgroup.github.io/FEARCITY/
**Admin Dashboard**: https://your-app.vercel.app/api/admin/dashboard

🏍️ **Fear City Cycles - Now Live on Vercel!** 🏍️