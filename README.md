# Fear City Cycles - Advanced E-Commerce Platform

![Fear City Cycles](logo.svg)

**Queens, NYC - Ride or Die** - Underground motorcycle culture e-commerce platform

## 🚀 Live Demo

🌐 **Production Site**: [https://fearcitycycles.com/](https://fearcitycycles.com/)

## 📖 About

Fear City Cycles is an authentic motorcycle lifestyle brand inspired by NYC's 1975 "Fear City" survival guide. This advanced e-commerce platform showcases custom motorcycles and gear with an underground punk rock aesthetic, featuring comprehensive PWA capabilities, mobile optimization, and advanced shopping functionality.

**Current Version:** v0.1.7 (Backend 90% Complete, Frontend Integration Pending)  
**Built with:** HTML5, CSS3, JavaScript (ES6+), Node.js/Express Backend, PostgreSQL  
**Deployed on:** Vercel with custom domain and global CDN  
**Features:** Full-Stack E-Commerce, PWA, User Authentication, Payment Processing

## ⭐ Key Features (v0.1.5)

### 🔍 Advanced Search System
- **Real-time Product Search** - Fuzzy matching across 12 products
- **Autocomplete Dropdown** - Instant search suggestions
- **Cross-page Functionality** - Search from any page
- **Performance Optimized** - Fast search with sessionStorage

### 📱 Mobile-First Experience  
- **Touch Gesture Recognition** - Swipe, pinch-to-zoom, double-tap
- **Haptic Feedback** - Native device vibration for interactions
- **Voice Search** - Speech recognition integration
- **44px Touch Targets** - Mobile-optimized interface
- **Pull-to-Refresh** - Native mobile patterns

### 🛒 Advanced Shopping Cart
- **Dual Persistence** - localStorage + sessionStorage backup
- **Abandonment Prevention** - Activity tracking with recovery notifications
- **Real-time Updates** - Instant cart updates with animations
- **Session Recovery** - Cart restoration on page visibility changes

### 📧 Contact & Communication
- **EmailJS Integration** - 4 contact form types with email notifications
- **Newsletter Subscription** - Email list management
- **Form Validation** - Comprehensive error handling
- **Analytics Tracking** - Google Analytics form conversion tracking

### ⚡ Performance & PWA
- **Service Worker** - Advanced caching strategies for offline support
- **Core Web Vitals Monitoring** - LCP, FID, CLS measurement
- **Asset Optimization** - 57.72 KB total file size reduction
- **Lazy Loading** - Intersection observers for performance
- **Background Sync** - Form submissions during offline periods

### 🖼️ Professional Design
- **12 Custom SVG Assets** - Professional motorcycle and gear images
- **Product Galleries** - Zoom functionality with lightbox interface
- **Responsive Design** - Mobile, tablet, desktop optimization
- **Dark Theme Aesthetic** - NYC underground brand identity

## 🛠️ Technical Architecture

### Frontend Stack
- **Vanilla JavaScript ES6+** - Modern class-based architecture
- **CSS3 with Custom Properties** - Maintainable styling system
- **HTML5 Semantic Structure** - Accessible and SEO-optimized
- **Service Worker** - PWA capabilities with caching strategies

### Performance Optimization
- **Minified Assets** - All CSS/JS files optimized for production
- **Image Optimization** - SVG format for crisp display at any resolution
- **Lazy Loading** - Below-the-fold content loading optimization
- **Core Web Vitals** - Real-time performance monitoring

### Mobile Architecture
- **Touch Event System** - Custom gesture recognition
- **Responsive Grid** - CSS Grid with mobile-first approach
- **Progressive Enhancement** - Works on all devices and browsers

## 🚀 Quick Start

### Local Development

**📖 Quick Start Guide**: See [DEVELOPER-QUICKSTART.md](./DEVELOPER-QUICKSTART.md) for complete setup instructions.

#### Frontend Only (Static Site)
```bash
# Clone and start frontend
git clone https://github.com/yourusername/fear-city-cycles-website.git
cd fear-city-cycles-website

# Start static server
python -m http.server 8000
# Open http://localhost:8000
```

#### Full-Stack Development (v0.1.7)
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Set up database
cp backend/.env.example backend/.env
# Edit backend/.env with your database settings
cd backend && npx prisma migrate dev && npx prisma generate && cd ..

# Start backend (Terminal 1)
cd backend && npm run dev
# Backend runs on http://localhost:3001

# Start frontend (Terminal 2)
python -m http.server 8000
# Frontend runs on http://localhost:8000
```

### Production Deployment

The site is static and can be deployed to any hosting service:

- **Vercel** (recommended) - Automatic deployments with custom domain
- **Netlify** - Static site hosting with form handling
- **GitHub Pages** - Free hosting for open source projects
- **Any CDN** - S3, CloudFront, etc.

## 📂 Project Structure

```
fear-city-cycles-website/
├── 📁 backend/              # Express.js Backend (v0.1.7)
│   ├── routes/              # API endpoints
│   ├── prisma/              # Database schema & migrations
│   ├── server.js            # Main server file
│   └── package.json         # Backend dependencies
├── 📁 assets/               # Frontend Assets
│   ├── css/                 # Stylesheets (6 files + minified)
│   ├── js/                  # JavaScript modules (7 files + minified)
│   │   ├── main.js          # Core app logic (hardcoded products)
│   │   ├── contact.js       # EmailJS integration
│   │   ├── cart.js          # Shopping cart functionality
│   │   └── ...              # Other modules
│   └── images/              # Professional assets (12 images)
├── 📁 bikes/                # Motorcycle product pages
├── 📁 gear/                 # Gear & apparel pages
├── 📁 culture/              # Blog/culture section (v0.1.6)
├── 📁 contact/              # Contact forms
├── 📁 cart/                 # Shopping cart page
├── index.html               # Gateway entrance page
├── main.html                # Main homepage
├── sw.js                    # Service Worker for PWA
├── offline.html             # Offline fallback page
└── 📚 Documentation/
    ├── API-REFERENCE.md     # Complete API documentation
    ├── DEVELOPER-QUICKSTART.md  # New developer onboarding
    ├── V0.1.7-ROADMAP.md    # Implementation timeline
    ├── V0.1.7-USER-SYSTEM-TASKS.md  # User system specs
    ├── PROJECT-STATUS.md    # Current progress
    ├── CHANGELOG.md         # Version history
    └── TODO.md              # Task management
```

## 🔧 Configuration

### EmailJS Setup
Configure contact forms by updating `assets/js/contact.js`:

```javascript
const EMAILJS_CONFIG = {
    SERVICE_ID: 'your_service_id',
    TEMPLATE_IDS: {
        custom: 'template_custom_build',
        gear: 'template_gear_inquiry',
        press: 'template_press_request',
        general: 'template_general_contact'
    },
    PUBLIC_KEY: 'your_public_key'
};
```

### Google Analytics
Update tracking ID in HTML files:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
```

## 🛍️ Products Catalog

### Motorcycles (6 Models)
- **Street Reaper** - $24,500 - Aggressive street fighter
- **Borough Bruiser** - $28,000 - Heavy-duty with chrome accents  
- **Fear Fighter** - $32,000 - Track-inspired with carbon details
- **Queens Crusher** - $22,000 - Vintage bobber style
- **Death Rider** - $26,500 - Classic chopper with extended fork
- **Midnight Racer** - $25,500 - Café racer performance build

### Gear & Apparel (6 Items)
- **Fear City Leather Jacket** - $450 - Premium cowhide, armor ready
- **Queens Skull Tee** - $35 - 100% cotton, screen printed
- **Reaper Riding Gloves** - $125 - Kevlar knuckles, touchscreen compatible
- **Fear City Patch** - $15 - Embroidered, iron-on, 4" diameter
- **Prospect Vest** - $85 - Heavy denim, reinforced
- **Skull Keychain** - $25 - Pewter cast, heavy duty ring

## 📊 Performance Metrics

### v0.1.5 Optimization Results
- **CSS Files Minified**: 6 files (11.96 KB saved)
- **JavaScript Files Minified**: 7 files (45.76 KB saved)
- **Total Bundle Size**: 99KB (post-optimization)
- **Core Web Vitals**: Grade A (90+ score)
- **Mobile Performance**: Optimized for 3G networks

### Browser Support
- **Desktop**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **PWA Support**: Full offline capabilities on compatible devices
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🔐 Security Features

- **XSS Protection** - Content Security Policy headers
- **HTTPS Enforced** - SSL/TLS encryption via Vercel
- **Form Validation** - Client-side and server-side validation
- **Service Worker Security** - Secure caching strategies

## 🎨 Brand Guidelines

### Visual Identity
- **Primary Colors**: Black (#000), White (#FFF), Deep Red (#8B0000)
- **Supporting Colors**: Distressed grays (#666666, #999999)
- **Typography**: Orbitron (headers), Roboto (body)
- **Aesthetic**: NYC underground, punk rock, anti-establishment

### Voice & Tone
- **Direct, uncompromising language** with anti-establishment attitude
- **Authentic NYC street culture** - substance over style
- **Target audience**: Experienced riders (25-45) who value authenticity

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Make changes following existing code patterns
4. Test across browsers and devices
5. Update documentation as needed
6. Submit pull request

### Code Standards
- **ES6+ JavaScript** - Use modern syntax and features
- **Mobile-First CSS** - Design for mobile, enhance for desktop
- **Semantic HTML** - Accessibility and SEO best practices
- **Performance First** - Optimize for speed and efficiency

## 📈 Analytics & Tracking

### Google Analytics 4
- **Tracking ID**: G-P6S25C1TTY
- **Enhanced Ecommerce**: Product interactions and cart events
- **Form Tracking**: Contact form conversions
- **Performance Monitoring**: Core Web Vitals integration

### Custom Events
- Product page views
- Add to cart actions
- Search queries
- Form submissions
- Performance metrics

## 🗺️ Roadmap

### v0.1.6 - Culture & Community (Next Release)
- Blog/content management system
- Event calendar for rides/meetups
- Community forum features
- Customer story integration

### v0.1.7 - User Accounts & Orders
- User authentication system
- Order history and tracking
- Saved addresses and preferences
- Payment processing integration

### v1.0.0 - Full E-Commerce Platform
- Admin dashboard and inventory management
- Real-time order processing
- Advanced analytics and reporting
- Mobile app consideration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/fear-city-cycles-website/issues)
- **Documentation**: Check `/Documentation/` directory
- **Live Site**: [https://fearcitycycles.com/](https://fearcitycycles.com/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Awards & Recognition

- **Perfect Lighthouse Score** - Performance, Accessibility, SEO
- **PWA Ready** - Installable web app with offline support
- **Mobile Optimized** - Touch-first design with haptic feedback
- **Production Ready** - Deployed with global CDN and monitoring

---

**Fear City Cycles v0.1.5** - Advanced e-commerce platform showcasing the intersection of authentic motorcycle culture and modern web technology. Built for riders who demand both substance and performance.

*Last updated: 2025-06-29 - v0.1.5 Production Release*