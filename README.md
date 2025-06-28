# Fear City Cycles Website

![Fear City Cycles](logo.svg)

**Lean Mean Built in Queens** - Underground motorcycle culture website

## 🚀 Live Demo

Visit the live site: [Fear City Cycles on GitHub Pages](https://deusgroup.github.io/FEARCITY/)

## 📖 About

Fear City Cycles is an authentic motorcycle lifestyle brand inspired by NYC's 1975 "Fear City" survival guide. This website showcases custom motorcycles and gear with an underground punk rock aesthetic.

**Current Version:** v0.1.2  
**Built with:** HTML5, CSS3, JavaScript (Vanilla)  
**Deployed on:** GitHub Pages with automated CI/CD

## New Features in v0.1.2

### Code Structure Improvements
- **External CSS**: Moved all styles from inline to `styles.css` for better maintainability
- **External JavaScript**: Created `script.js` with interactive functionality
- **Clean HTML**: Removed inline styles and improved semantic structure

### Enhanced Product Showcase
- **Expanded Motorcycles**: Increased from 3 to 6 custom motorcycle options:
  - Street Reaper ($18,500)
  - Borough Bruiser ($22,000) 
  - Fear Fighter ($19,999)
  - Queens Crusher ($21,500)
  - Death Rider ($24,000)
  - Midnight Racer ($23,500)

- **Gear & Apparel Section**: Added new product category featuring:
  - Fear City Jacket ($299)
  - Queens Skull Tee ($35)
  - Reaper Riding Gloves ($89)

### Mobile Experience
- **Responsive Menu**: Added mobile hamburger menu with smooth animations
- **Touch-Friendly**: Enhanced mobile interactions and button sizing
- **Improved Layout**: Better grid responsiveness across all screen sizes

### Interactive Features
- **Shopping Cart**: Basic cart functionality with localStorage persistence
- **Product Interactions**: Enhanced hover effects and click handlers
- **Smooth Scrolling**: Internal navigation links with smooth scroll behavior
- **Visual Feedback**: Button animations and card hover effects

### SEO & Performance
- **Structured Data**: Added JSON-LD schema markup for local business
- **Meta Tags**: Enhanced SEO with keywords and Open Graph tags
- **Clean Code**: Separated concerns for better performance and maintainability

## Files Structure

```
v0.1.2/
├── index.html          # Gateway page (uses external CSS/JS)
├── main.html           # Main site (6 motorcycles + 3 gear items)
├── styles.css          # All styles (gateway + main site + mobile)
├── script.js           # Interactive functionality
├── logo.svg           # Fear City Cycles logo
└── README.md          # This documentation
```

## Technical Improvements

### CSS Architecture
- Organized styles by component (gateway, navigation, products, mobile)
- Mobile-first responsive design with clean breakpoints
- Consistent color scheme and typography system
- Enhanced visual hierarchy and spacing

### JavaScript Functionality
- Mobile menu toggle with animated hamburger icon
- Shopping cart with localStorage persistence
- Enhanced user interactions and feedback
- Product card hover effects and animations
- Notification system for user actions

### HTML Structure
- Semantic HTML5 elements
- Proper heading hierarchy
- Accessibility considerations
- Clean separation of content and presentation

## Browser Testing
- Tested on desktop and mobile viewports
- Smooth animations and transitions
- Responsive grid layouts
- Mobile menu functionality

## 🚀 Deployment

### Automatic Deployment
This site is automatically deployed to GitHub Pages using GitHub Actions:

1. **Push to main branch** triggers automatic deployment
2. **GitHub Actions** builds and deploys the site
3. **Live site** updates within minutes

### Manual Deployment Steps
```bash
# Clone the repository
git clone https://github.com/DeusGroup/FEARCITY.git

# Navigate to directory
cd FEARCITY

# Open index.html in browser for local testing
open index.html
```

### GitHub Pages Setup
1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. The GitHub Action will handle the rest!

## 🛠️ Development

### Local Development
```bash
# Simple local server options:

# Python 3
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000

# Then visit: http://localhost:8000
```

### File Structure
```
FEARCITY/
├── index.html          # Gateway entrance page
├── main.html           # Main site homepage  
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
├── logo.svg           # Fear City Cycles logo
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions deployment
└── versions/           # Previous versions for reference
```

## 🎨 Design Features

- **Premium Punk Aesthetic**: Clean lines meet rebellious attitude
- **Mobile-First Design**: Responsive across all devices
- **Modern Typography**: Bebas Neue, Orbitron, and Rajdhani fonts
- **Interactive Elements**: Hover effects and smooth transitions
- **Optimized Performance**: Fast loading and efficient code

## 📱 Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions) 
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔮 Roadmap

### v0.1.3 (Next Release)
- [ ] Product image integration
- [ ] Contact form functionality
- [ ] Additional product pages
- [ ] Enhanced mobile menu
- [ ] Performance optimizations

### v0.2.0 (Future)
- [ ] E-commerce backend integration
- [ ] User account system
- [ ] Advanced shopping cart
- [ ] Payment processing
- [ ] Inventory management

## 📄 License

This website is proprietary to Fear City Cycles brand. All design elements, code, and concepts are owned by Fear City Cycles.

---

**Fear City Cycles - Lean Mean Built in Queens** 🏍️  
*Authentic underground motorcycle culture since Queens, NYC*