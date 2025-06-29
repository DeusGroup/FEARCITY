const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Generate a secure random password
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

async function main() {
  console.log('🌱 Seeding Fear City Cycles database...');

  // Create categories
  const motorcycleCategory = await prisma.category.upsert({
    where: { slug: 'motorcycles' },
    update: {},
    create: {
      name: 'Motorcycles',
      slug: 'motorcycles',
      description: 'Street-ready motorcycles built for the urban battlefield'
    }
  });

  const gearCategory = await prisma.category.upsert({
    where: { slug: 'gear' },
    update: {},
    create: {
      name: 'Gear & Apparel',
      slug: 'gear',
      description: 'Premium motorcycle gear and Fear City branded apparel'
    }
  });

  console.log('✅ Categories created');

  // Create motorcycles
  const motorcycles = [
    {
      name: 'Street Reaper',
      slug: 'street-reaper',
      description: 'Born in the shadows of Queens streets, the Street Reaper combines raw power with urban agility. This machine doesn\'t just ride the streets—it owns them.',
      shortDescription: 'Raw power meets urban agility in this street-dominating machine.',
      price: 18500.00,
      sku: 'BIKE-SR-001',
      quantity: 3,
      specifications: {
        engine: '883cc V-Twin',
        horsepower: '75 HP',
        torque: '65 ft-lbs',
        transmission: '6-speed',
        weight: '485 lbs',
        seat_height: '28 inches',
        fuel_capacity: '3.3 gallons',
        wheelbase: '60.2 inches'
      },
      features: [
        'Custom Fear City paint job',
        'Performance exhaust system',
        'LED lighting package',
        'Aggressive riding position',
        'Street-tuned suspension'
      ],
      tags: ['street', 'urban', 'performance', 'custom'],
      images: ['/assets/images/bike-street-reaper.jpg'],
      primaryImage: '/assets/images/bike-street-reaper.jpg',
      isFeatured: true,
      categoryId: motorcycleCategory.id
    },
    {
      name: 'Borough Bruiser',
      slug: 'borough-bruiser',
      description: 'Each of NYC\'s five boroughs forged a piece of this beast. The Borough Bruiser represents the diversity and strength that makes New York unstoppable.',
      shortDescription: 'Five boroughs, one unstoppable machine built for NYC streets.',
      price: 21200.00,
      sku: 'BIKE-BB-001',
      quantity: 2,
      specifications: {
        engine: '1200cc V-Twin',
        horsepower: '95 HP',
        torque: '85 ft-lbs',
        transmission: '6-speed',
        weight: '520 lbs',
        seat_height: '29 inches',
        fuel_capacity: '4.5 gallons',
        wheelbase: '62.1 inches'
      },
      features: [
        'Borough-inspired graphics',
        'Premium suspension package',
        'Custom exhaust note',
        'Reinforced frame',
        'NYC-themed accessories'
      ],
      tags: ['nyc', 'borough', 'premium', 'custom'],
      images: ['/assets/images/bike-borough-bruiser.jpg'],
      primaryImage: '/assets/images/bike-borough-bruiser.jpg',
      isFeatured: true,
      categoryId: motorcycleCategory.id
    },
    {
      name: 'Fear Fighter',
      slug: 'fear-fighter',
      description: 'When the city gets tough, the Fear Fighter gets going. Track-inspired performance meets street-legal rebellion in this ultimate urban warrior.',
      shortDescription: 'Track-inspired performance meets street-legal rebellion.',
      price: 24800.00,
      sku: 'BIKE-FF-001',
      quantity: 1,
      specifications: {
        engine: '1340cc V-Twin',
        horsepower: '115 HP',
        torque: '105 ft-lbs',
        transmission: '6-speed',
        weight: '475 lbs',
        seat_height: '31 inches',
        fuel_capacity: '4.2 gallons',
        wheelbase: '58.5 inches'
      },
      features: [
        'Track-tuned performance',
        'Racing-inspired aesthetics',
        'Premium Brembo brakes',
        'Adjustable suspension',
        'Carbon fiber accents'
      ],
      tags: ['track', 'performance', 'racing', 'premium'],
      images: ['/assets/images/bike-fear-fighter.jpg'],
      primaryImage: '/assets/images/bike-fear-fighter.jpg',
      isFeatured: true,
      categoryId: motorcycleCategory.id
    },
    {
      name: 'Queens Crusher',
      slug: 'queens-crusher',
      description: 'Built in the heart of Queens, this vintage-inspired bobber carries the soul of old-school rebellion with modern reliability.',
      shortDescription: 'Vintage-inspired bobber with old-school rebellion and modern reliability.',
      price: 16900.00,
      sku: 'BIKE-QC-001',
      quantity: 4,
      specifications: {
        engine: '750cc V-Twin',
        horsepower: '65 HP',
        torque: '58 ft-lbs',
        transmission: '5-speed',
        weight: '445 lbs',
        seat_height: '26 inches',
        fuel_capacity: '3.8 gallons',
        wheelbase: '61.5 inches'
      },
      features: [
        'Vintage bobber styling',
        'Classic spoked wheels',
        'Minimal electronics',
        'Authentic leather seat',
        'Chrome details'
      ],
      tags: ['vintage', 'bobber', 'classic', 'queens'],
      images: ['/assets/images/bike-queens-crusher.jpg'],
      primaryImage: '/assets/images/bike-queens-crusher.jpg',
      categoryId: motorcycleCategory.id
    },
    {
      name: 'Death Rider',
      slug: 'death-rider',
      description: 'For those who dance with danger, the Death Rider offers classic chopper styling with a menacing presence that commands respect.',
      shortDescription: 'Classic chopper styling with a menacing presence that commands respect.',
      price: 19700.00,
      sku: 'BIKE-DR-001',
      quantity: 2,
      specifications: {
        engine: '1000cc V-Twin',
        horsepower: '78 HP',
        torque: '72 ft-lbs',
        transmission: '4-speed',
        weight: '510 lbs',
        seat_height: '27 inches',
        fuel_capacity: '4.0 gallons',
        wheelbase: '68.2 inches'
      },
      features: [
        'Extended chopper fork',
        'Custom flame graphics',
        'Ape hanger handlebars',
        'Stepped seat design',
        'Classic chopper stance'
      ],
      tags: ['chopper', 'classic', 'custom', 'extended'],
      images: ['/assets/images/bike-death-rider.jpg'],
      primaryImage: '/assets/images/bike-death-rider.jpg',
      categoryId: motorcycleCategory.id
    },
    {
      name: 'Midnight Racer',
      slug: 'midnight-racer',
      description: 'When the sun goes down and the city comes alive, the Midnight Racer emerges. This café racer embodies the spirit of late-night urban adventures.',
      shortDescription: 'Café racer built for late-night urban adventures and city exploration.',
      price: 22400.00,
      sku: 'BIKE-MR-001',
      quantity: 3,
      specifications: {
        engine: '1100cc V-Twin',
        horsepower: '88 HP',
        torque: '78 ft-lbs',
        transmission: '6-speed',
        weight: '465 lbs',
        seat_height: '30 inches',
        fuel_capacity: '3.7 gallons',
        wheelbase: '57.8 inches'
      },
      features: [
        'Café racer aesthetics',
        'Clip-on handlebars',
        'Racing-style fairing',
        'Rear-set foot controls',
        'Minimalist design'
      ],
      tags: ['cafe-racer', 'midnight', 'racing', 'minimalist'],
      images: ['/assets/images/bike-midnight-racer.jpg'],
      primaryImage: '/assets/images/bike-midnight-racer.jpg',
      categoryId: motorcycleCategory.id
    }
  ];

  for (const bike of motorcycles) {
    await prisma.product.upsert({
      where: { sku: bike.sku },
      update: bike,
      create: bike
    });
  }

  console.log('✅ Motorcycles created');

  // Create gear & apparel
  const gear = [
    {
      name: 'Fear City Jacket',
      slug: 'fear-city-jacket',
      description: 'Premium leather motorcycle jacket featuring the iconic Fear City logo. Built to protect and intimidate in equal measure.',
      shortDescription: 'Premium leather motorcycle jacket with iconic Fear City branding.',
      price: 495.00,
      sku: 'GEAR-FCJ-001',
      quantity: 15,
      specifications: {
        material: 'Premium cowhide leather',
        protection: 'CE-rated armor in shoulders and elbows',
        closure: 'Heavy-duty zipper with snap storm flap',
        pockets: '4 external, 2 internal',
        lining: 'Quilted polyester',
        sizes: 'S, M, L, XL, XXL'
      },
      features: [
        'Genuine leather construction',
        'CE-rated protective armor',
        'Fear City embroidered patches',
        'Adjustable side laces',
        'Premium YKK zippers'
      ],
      tags: ['leather', 'jacket', 'protection', 'branded'],
      images: ['/assets/images/jacket-fear-city.jpg'],
      primaryImage: '/assets/images/jacket-fear-city.jpg',
      isFeatured: true,
      categoryId: gearCategory.id
    },
    {
      name: 'Queens Skull Tee',
      slug: 'queens-skull-tee',
      description: 'Represent the Fear City lifestyle with this premium cotton tee featuring original skull artwork inspired by Queens street culture.',
      shortDescription: 'Premium cotton tee with original Queens skull artwork.',
      price: 45.00,
      sku: 'GEAR-QST-001',
      quantity: 50,
      specifications: {
        material: '100% premium cotton',
        weight: '180 GSM',
        fit: 'Regular fit',
        printing: 'Screen printed graphics',
        care: 'Machine washable',
        sizes: 'S, M, L, XL, XXL'
      },
      features: [
        'Premium cotton construction',
        'Original skull artwork',
        'Screen printed graphics',
        'Pre-shrunk fabric',
        'Fear City branded'
      ],
      tags: ['tee', 'cotton', 'skull', 'queens', 'branded'],
      images: ['/assets/images/tee-queens-skull.jpg'],
      primaryImage: '/assets/images/tee-queens-skull.jpg',
      categoryId: gearCategory.id
    },
    {
      name: 'Reaper Riding Gloves',
      slug: 'reaper-riding-gloves',
      description: 'Professional-grade riding gloves that provide superior grip and protection while maintaining the Fear City aesthetic.',
      shortDescription: 'Professional-grade riding gloves with superior grip and protection.',
      price: 125.00,
      sku: 'GEAR-RRG-001',
      quantity: 25,
      specifications: {
        material: 'Leather palm with textile back',
        protection: 'Knuckle guards and palm sliders',
        closure: 'Velcro wrist strap',
        touchscreen: 'Compatible fingertips',
        ventilation: 'Perforated palm',
        sizes: 'S, M, L, XL'
      },
      features: [
        'Leather and textile construction',
        'Knuckle protection',
        'Touchscreen compatible',
        'Ventilated design',
        'Fear City branding'
      ],
      tags: ['gloves', 'protection', 'leather', 'riding'],
      images: ['/assets/images/gloves-reaper-riding.jpg'],
      primaryImage: '/assets/images/gloves-reaper-riding.jpg',
      categoryId: gearCategory.id
    }
  ];

  for (const item of gear) {
    await prisma.product.upsert({
      where: { sku: item.sku },
      update: item,
      create: item
    });
  }

  console.log('✅ Gear & apparel created');

  // Create admin user
  const bcrypt = require('bcryptjs');
  const adminPassword = process.env.ADMIN_PASSWORD || generateSecurePassword();
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  if (!process.env.ADMIN_PASSWORD) {
    console.log('⚠️  No ADMIN_PASSWORD env var set. Generated password:', adminPassword);
    console.log('⚠️  Please save this password securely and set ADMIN_PASSWORD env var');
  }

  await prisma.adminUser.upsert({
    where: { email: 'admin@fearcitycycles.com' },
    update: {},
    create: {
      email: 'admin@fearcitycycles.com',
      password: hashedPassword,
      firstName: 'Fear City',
      lastName: 'Admin',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ Admin user created');

  // Create default settings
  const settings = [
    {
      key: 'site_name',
      value: 'Fear City Cycles'
    },
    {
      key: 'site_tagline',
      value: 'Lean Mean Built in Queens'
    },
    {
      key: 'free_shipping_threshold',
      value: 500.00
    },
    {
      key: 'tax_rate',
      value: 0.0825
    },
    {
      key: 'default_shipping_cost',
      value: 50.00
    },
    {
      key: 'contact_email',
      value: 'info@fearcitycycles.com'
    },
    {
      key: 'contact_phone',
      value: '(718) 555-0123'
    }
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }

  console.log('✅ Settings created');

  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();

  console.log(`
🏍️  Fear City Cycles Database Seeded Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ${productCount} products created
📂 ${categoryCount} categories created
👤 1 admin user created
⚙️  ${settings.length} settings configured
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Ready to ride! Start the server with: npm run dev
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });