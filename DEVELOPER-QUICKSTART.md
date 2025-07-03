# Developer Quick Start Guide

Welcome to Fear City Cycles! This guide will get you up and running with the development environment in minutes.

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL** (for backend) - [Download here](https://postgresql.org/) or use cloud service
- **Code Editor** - VS Code recommended

## 🚀 Quick Setup (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/fear-city-cycles-website.git
cd fear-city-cycles-website
```

### 2. Install Dependencies
```bash
# Install root dependencies (for testing)
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Set Up Environment Variables
```bash
# Copy example environment file
cp backend/.env.example backend/.env

# Edit with your settings (see configuration section below)
```

### 4. Set Up Database (Backend)
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed with sample data
npm run seed

cd ..
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
# Static file server for HTML/CSS/JS
python -m http.server 8000
# OR
npx http-server -p 8000
```
Frontend runs on: http://localhost:8000

## 🌐 Access the Application

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Database Browser**: `npx prisma studio` (in backend directory)

## 🔧 Essential Configuration

### Backend Environment Variables

Edit `backend/.env` with these required values:

```env
# Database (required)
DATABASE_URL="postgresql://username:password@localhost:5432/fear_city_cycles"

# JWT Secret (required)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Square Payments (for checkout testing)
SQUARE_ENVIRONMENT=sandbox
SQUARE_APPLICATION_ID=your-square-app-id
SQUARE_ACCESS_TOKEN=your-square-access-token

# Email (for contact forms)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8000
```

### Database Options

**Option 1: Local PostgreSQL**
```bash
# Install PostgreSQL locally
# Create database
createdb fear_city_cycles

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://username:password@localhost:5432/fear_city_cycles"
```

**Option 2: Cloud Database (Recommended)**
- **Supabase** (free): https://supabase.com
- **Vercel Postgres**: https://vercel.com/storage/postgres
- **Neon** (free): https://neon.tech

Get connection string from your chosen provider and update `DATABASE_URL`.

## 📁 Project Structure

```
fear-city-cycles-website/
├── 📁 backend/              # Express.js API server
│   ├── 📁 routes/           # API endpoints
│   ├── 📁 prisma/           # Database schema & migrations
│   ├── server.js            # Main server file
│   └── package.json         # Backend dependencies
├── 📁 assets/               # Frontend assets
│   ├── 📁 css/              # Stylesheets
│   ├── 📁 js/               # JavaScript files
│   └── 📁 images/           # Images and media
├── 📁 bikes/                # Motorcycle product pages
├── 📁 gear/                 # Gear product pages
├── 📁 culture/              # Blog/culture section
├── index.html               # Gateway page
├── main.html                # Main homepage
└── README.md                # Project documentation
```

## 🛠️ Development Workflow

### Frontend Development
1. Edit HTML files in root directory
2. Modify CSS in `assets/css/`
3. Update JavaScript in `assets/js/`
4. Refresh browser to see changes (http://localhost:8000)

### Backend Development
1. Edit API routes in `backend/routes/`
2. Update database schema in `backend/prisma/schema.prisma`
3. Run migrations: `npx prisma migrate dev`
4. Test endpoints: Use Postman or curl
5. Server auto-restarts with nodemon

### Database Changes
```bash
cd backend

# After editing schema.prisma
npx prisma migrate dev --name description-of-change

# Regenerate client
npx prisma generate

# View database
npx prisma studio
```

## 🧪 Testing Your Setup

### 1. Test Frontend
```bash
# Should show the Fear City Cycles gateway page
curl http://localhost:8000
```

### 2. Test Backend
```bash
# Health check
curl http://localhost:3001/health

# Get products
curl http://localhost:3001/api/products
```

### 3. Test Database
```bash
cd backend
npx prisma studio
# Opens database browser in your web browser
```

## 🚧 Current v0.1.7 Status

### ✅ What's Working (Backend 90% Complete)
- All API endpoints functional
- Database schema complete
- Authentication system ready
- Payment processing (Square) ready
- Security features implemented

### 🔄 What's In Progress (Frontend Integration)
- Replace hardcoded products with API calls
- Connect shopping cart to backend
- Implement user authentication UI
- Create user dashboard

## 🐛 Common Issues & Solutions

### "Database connection failed"
```bash
# Check if PostgreSQL is running
pg_ctl status

# Or check your cloud database connection string
# Make sure DATABASE_URL in .env is correct
```

### "Port 3001 already in use"
```bash
# Kill process on port 3001
kill $(lsof -ti:3001)

# Or use different port
PORT=3002 npm run dev
```

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend not loading properly
```bash
# Make sure you're in the root directory
# Use correct port (8000 for frontend, 3001 for backend)
# Check browser console for errors
```

## 📚 Next Steps for v0.1.7

After setup, follow this development sequence:

### Week 1: Basic Integration
1. **Read**: [V0.1.7-ROADMAP.md](./V0.1.7-ROADMAP.md)
2. **Create**: `assets/js/api.js` (API integration layer)
3. **Update**: `assets/js/main.js` (replace hardcoded products)
4. **Test**: Products loading from database

### Week 2: Authentication
1. **Read**: [V0.1.7-USER-SYSTEM-TASKS.md](./V0.1.7-USER-SYSTEM-TASKS.md)
2. **Create**: Login page (`login/index.html`)
3. **Create**: Registration page (`register/index.html`)
4. **Implement**: JWT token management

### Week 3: User Features
1. **Create**: User dashboard (`account/index.html`)
2. **Implement**: Order history display
3. **Add**: Address management
4. **Connect**: Cart to backend persistence

### Week 4: Final Integration
1. **Implement**: Checkout flow with Square
2. **Test**: End-to-end order processing
3. **Deploy**: Backend to Vercel
4. **Update**: Frontend API URLs

## 📖 Documentation Index

- **[API-REFERENCE.md](./API-REFERENCE.md)** - Complete API documentation
- **[V0.1.7-ROADMAP.md](./V0.1.7-ROADMAP.md)** - Implementation timeline
- **[V0.1.7-USER-SYSTEM-TASKS.md](./V0.1.7-USER-SYSTEM-TASKS.md)** - User system specs
- **[backend/README.md](./backend/README.md)** - Backend-specific docs
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[PROJECT-STATUS.md](./PROJECT-STATUS.md)** - Current progress

## 🤝 Getting Help

1. **Check documentation** above
2. **Search existing issues** in the repository
3. **Test API endpoints** with Postman/curl
4. **Check console logs** in browser and terminal
5. **Create an issue** if you're stuck

## 🎯 Success Criteria

You're ready to start development when:
- ✅ Frontend loads at http://localhost:8000
- ✅ Backend responds at http://localhost:3001/health
- ✅ Database browser opens with `npx prisma studio`
- ✅ Products API returns data: http://localhost:3001/api/products

---

**Welcome to the team! Let's build something awesome.** 🏍️

*Queens, NYC - Ride or Die*