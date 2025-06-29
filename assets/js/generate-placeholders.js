// Generate optimized placeholder images for immediate deployment
class PlaceholderGenerator {
    constructor() {
        this.sizes = {
            product: { width: 800, height: 600 },
            gear: { width: 600, height: 600 },
            logo: { width: 400, height: 200 },
            hero: { width: 1200, height: 800 }
        };
    }

    generateOptimizedImage(name, type, title) {
        const canvas = document.createElement('canvas');
        const size = this.sizes[type] || this.sizes.product;
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');

        // Create optimized placeholder
        this.drawBackground(ctx, size, type);
        this.drawContent(ctx, size, type, title);
        this.drawBranding(ctx, size);

        return canvas;
    }

    drawBackground(ctx, size, type) {
        // Dark gradient background
        const gradient = ctx.createLinearGradient(0, 0, size.width, size.height);
        gradient.addColorStop(0, '#111');
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size.width, size.height);

        // Red accent border
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, size.width-2, size.height-2);
    }

    drawContent(ctx, size, type, title) {
        const w = size.width;
        const h = size.height;

        if (type === 'product' || type === 'gear') {
            // Product placeholder
            ctx.fillStyle = '#333';
            ctx.fillRect(w*0.2, h*0.3, w*0.6, h*0.4);
            
            // Product icon
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(w*0.5, h*0.5, Math.min(w, h)*0.1, 0, 2 * Math.PI);
            ctx.fill();
        } else if (type === 'hero') {
            // Hero content
            ctx.fillStyle = '#000';
            for (let i = 0; i < 15; i++) {
                const x = (w / 15) * i;
                const height = Math.random() * h * 0.2 + h * 0.05;
                ctx.fillRect(x, h - height, w/15, height);
            }
        }

        // Title
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${Math.floor(Math.min(w, h)/15)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(title, w/2, h*0.2);
    }

    drawBranding(ctx, size) {
        const w = size.width;
        const h = size.height;

        // Fear City branding
        ctx.fillStyle = '#8B0000';
        ctx.font = `${Math.floor(Math.min(w, h)/25)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('FEAR CITY CYCLES', w/2, h*0.9);
    }

    generateAll() {
        const images = [
            // Bikes
            { name: 'bike-street-reaper', type: 'product', title: 'STREET REAPER' },
            { name: 'bike-borough-bruiser', type: 'product', title: 'BOROUGH BRUISER' },
            { name: 'bike-fear-fighter', type: 'product', title: 'FEAR FIGHTER' },
            { name: 'bike-queens-crusher', type: 'product', title: 'QUEENS CRUSHER' },
            { name: 'bike-death-rider', type: 'product', title: 'DEATH RIDER' },
            { name: 'bike-midnight-racer', type: 'product', title: 'MIDNIGHT RACER' },
            
            // Gear
            { name: 'jacket-fear-city', type: 'gear', title: 'FEAR CITY JACKET' },
            { name: 'tee-queens-skull', type: 'gear', title: 'QUEENS SKULL TEE' },
            { name: 'gloves-reaper-riding', type: 'gear', title: 'REAPER GLOVES' },
            { name: 'patch-fear-city', type: 'gear', title: 'FEAR CITY PATCH' },
            { name: 'vest-prospect', type: 'gear', title: 'PROSPECT VEST' },
            { name: 'keychain-skull', type: 'gear', title: 'SKULL KEYCHAIN' }
        ];

        images.forEach(img => {
            const canvas = this.generateOptimizedImage(img.name, img.type, img.title);
            this.downloadImage(canvas, img.name + '-optimized.jpg');
        });
    }

    downloadImage(canvas, filename) {
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.8);
    }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.PlaceholderGenerator = PlaceholderGenerator;
}