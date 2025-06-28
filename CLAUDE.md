# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Brand Voice & Target Audience

**Brand Identity**: Underground motorcycle culture inspired by NYC's 1975 "Fear City" survival guide
- **Voice**: Direct, uncompromising language with anti-establishment tone
- **Style**: Authentic NYC street attitude - focus on substance over style
- **Target**: Experienced motorcycle riders (25-45) who value authenticity over mainstream appeal
- **Tagline**: "Queens, NYC - Ride or Die"

## Development Commands

### Local Development Server
```bash
# Python (if available)
python -m http.server 8000

# Node.js (if available)
npx http-server

# Access at: http://localhost:8000
```

### Testing
- No automated tests currently implemented
- Manual testing required across browsers (latest 2 versions of Chrome, Firefox, Safari, Edge)
- Test responsive design at mobile (375px), tablet (768px), and desktop (1200px+) breakpoints

### Validation
- HTML validation: Use W3C validator
- CSS validation: Check for browser compatibility
- JavaScript: No linting/build process - manual code review required
- Security: XSS protection implemented, HTTPS required for production

## Architecture Overview

### Two-Stage User Flow
1. **Gateway Page** (`index.html`) - Dramatic brand entrance with "ENTER THE CITY" interaction
2. **Main Site** (`main.html`) - Full e-commerce functionality accessed after gateway

### Core JavaScript Architecture

**JavaScript Files**:
- `gateway.js` - Gateway page interactions and "ENTER THE CITY" functionality
- `main.js` - Main site functionality including shopping cart, navigation, and animations
- `contact.js` - Contact form handling and validation
- `cart.js` - Shopping cart page-specific functionality

**Shopping Cart System** (ShoppingCart class in `assets/js/main.js`)
- Class-based implementation using ES6+ features
- LocalStorage persistence for cart data
- Real-time UI updates with cart count badge
- Toast notifications for user feedback

**Event-Driven Pattern**
- DOMContentLoaded initialization (`assets/js/main.js:110`)
- Delegated event handling for dynamic content
- Custom events for cart updates

**Key Global Objects**
- `window.fearCityCart` - Shopping cart instance accessible across pages
- LocalStorage keys: `fearCityCart` (cart items), `fearCityUser` (future user data)

### CSS Architecture

**CSS Files**:
- `gateway.css` - Gateway page specific styles
- `main.css` - Main site styles and design system
- `responsive.css` - Mobile/tablet responsive overrides
- `pages.css` - Page-specific styles for bikes, gear, contact, etc.

**Design System Variables** (defined in `main.css`)
- Primary colors: Black (#000), White (#FFF), Deep Red (#8B0000)
- Supporting colors: Distressed grays (#666666, #999999)
- Typography: Orbitron (headers), Roboto (body)
- Breakpoints: 768px (tablet), 1200px (desktop)

**Component Structure**
- BEM-like naming convention (`.product-card`, `.product-card__title`)
- Mobile-first responsive design
- CSS Grid for layouts, Flexbox for components
- Distressed textures and worn effects for punk aesthetic

### Page Templates

All product pages follow similar structure:
1. Navigation header with cart
2. Hero section with parallax effect
3. Product grid with filtering
4. Footer with newsletter signup

### Data Flow

1. **Product Display**: Static HTML, no backend integration
2. **Cart Operations**: Client-side only via LocalStorage
3. **Forms**: Frontend validation only, no backend submission
4. **Search**: Placeholder functionality, not implemented

## Development Guidelines

### Adding New Products
1. Add product HTML to relevant page (`bikes/index.html` or `gear/index.html`)
2. Include required data attributes: `data-product-id`, `data-price`, `data-size`
3. Ensure image follows naming convention: `product-name.jpg`

### Modifying Styles
1. Check existing CSS variables before adding new colors
2. Use existing utility classes when possible
3. Maintain mobile-first approach - desktop styles in media queries

### JavaScript Modifications
1. Use existing cart instance via `window.fearCityCart`
2. Follow event delegation pattern for dynamic content
3. Add animations/transitions via CSS, trigger with JavaScript classes

### Performance Considerations
- Images should be optimized (max 200KB for products, 500KB for heroes)
- Lazy load images below the fold
- Minimize JavaScript execution on page load
- Use CSS transforms for animations (GPU-accelerated)

## Common Tasks

### Update Product Pricing
Edit HTML directly in product pages - prices are stored as `data-price` attributes

### Add New Product Category
1. Create new directory (e.g., `parts/`)
2. Copy template from `bikes/index.html`
3. Update navigation in all HTML files
4. Add category-specific styles to `pages.css`

### Implement Missing Features
- **Search**: Hook up search form (`assets/js/main.js:154-162`) to filter products
- **User Accounts**: Create login/registration in `account/` directory
- **Payment Processing**: Integrate payment gateway in checkout flow

### Debug Cart Issues
Check LocalStorage in DevTools: `localStorage.getItem('fearCityCart')`

## Documentation Requirements

When working on this project, maintain comprehensive documentation:

### Required Documentation Files
- **PROJECT-STATUS.md** - Track overall completion percentage and feature status
- **CHANGELOG.md** - Version history following semantic versioning
- **TODO.md** - Detailed task lists with priority levels and categories
- **README.md** - Project overview and setup instructions
- **CLAUDE.md** - This file, for AI assistance guidance

### Documentation Standards
1. **Update TODO.md** whenever:
   - New tasks are identified
   - Tasks are started (mark as in_progress)
   - Tasks are completed (mark with date)
   - Priorities change

2. **Update PROJECT-STATUS.md** when:
   - Major features are completed
   - Overall completion percentage changes
   - New blockers are identified

3. **Update CHANGELOG.md** for:
   - New releases or versions
   - Significant feature additions
   - Breaking changes
   - Bug fixes

4. **Track All Work**: Use the TodoWrite/TodoRead tools for real-time task tracking

## Important Notes

- This is a static site with no backend - all functionality is client-side
- Forms don't actually submit anywhere - they show success messages only
- Product data is hardcoded in HTML - no database or API
- SEO: Focus on local NYC search optimization and schema markup readiness
- The gateway page is intentionally dramatic - don't tone it down
- Security: XSS protection is implemented, HTTPS required for production

## Required Image Assets

All images should be placed in `assets/images/`:

### Logo Assets
- `fear-city-logo.png` - Main logo for gateway
- `fear-city-logo-small.png` - Navigation logo
- `favicon.ico` - Browser favicon

### Hero Images
- `hero-bg.jpg` - Hero background
- `hero-bike.jpg` - Featured motorcycle
- `dark-texture.jpg` - Background texture
- `nyc-streets.jpg` - Culture section

### Product Images - Motorcycles
- `bike-street-reaper.jpg`
- `bike-borough-bruiser.jpg`
- `bike-fear-fighter.jpg`
- `bike-queens-crusher.jpg`
- `bike-death-rider.jpg`
- `bike-midnight-racer.jpg`

### Product Images - Gear & Apparel
- `jacket-fear-city.jpg`
- `tee-queens-skull.jpg`
- `gloves-reaper-riding.jpg`
- `patch-fear-city.jpg`
- `vest-prospect.jpg`
- `keychain-skull.jpg`

## Future Development Roadmap

### TODO Directories
- `culture/` - Blog and community features
- `garage/` - Service offerings
- `account/` - User authentication system
- `admin/` - Backend administration

### Phase 2 - Core E-commerce
- Advanced customization tools
- User account system
- Order management
- Inventory integration

### Phase 3 - Community Features
- Community forum
- Blog content management
- Event calendar
- Customer reviews

### Phase 4 - Advanced Features
- Mobile app consideration
- Augmented reality product viewing
- Advanced personalization