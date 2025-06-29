#!/usr/bin/env node

const crypto = require('crypto');

// Generate secure random strings
function generateSecureString(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

// Generate JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Generate database password
function generateDatabasePassword() {
  const length = 24;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

// Generate admin password
function generateAdminPassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

console.log('🔐 Generating new secure credentials...\n');

const newCredentials = {
  databasePassword: generateDatabasePassword(),
  jwtSecret: generateJWTSecret(),
  adminPassword: generateAdminPassword()
};

console.log('📋 New Credentials Generated:\n');
console.log('DATABASE PASSWORD:');
console.log(newCredentials.databasePassword);
console.log('\nJWT SECRET:');
console.log(newCredentials.jwtSecret);
console.log('\nADMIN PASSWORD:');
console.log(newCredentials.adminPassword);

console.log('\n📝 Next Steps:');
console.log('1. Go to Supabase Dashboard: https://app.supabase.com/project/qmjauzmtznndsysnaxzo');
console.log('2. Navigate to Settings → Database');
console.log('3. Reset database password using the generated password above');
console.log('4. Navigate to Settings → API');
console.log('5. Regenerate both anon and service_role keys');
console.log('6. Update JWT secret in Auth settings');
console.log('\n7. Create a new .env file with:');
console.log('   cp .env.example .env');
console.log('   Then fill in all the new values');

// Generate .env template
const envTemplate = `# Supabase Configuration
VITE_SUPABASE_URL=https://qmjauzmtznndsysnaxzo.supabase.co
VITE_SUPABASE_ANON_KEY=<NEW_ANON_KEY_FROM_SUPABASE>

# Backend Only - DO NOT expose these in frontend
SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_ROLE_KEY_FROM_SUPABASE>
SUPABASE_JWT_SECRET=${newCredentials.jwtSecret}

# Database Configuration - Backend Only
DATABASE_URL=postgresql://postgres:${newCredentials.databasePassword}@db.qmjauzmtznndsysnaxzo.supabase.co:5432/postgres
PGUSER=postgres
PGPASSWORD=${newCredentials.databasePassword}
PGHOST=db.qmjauzmtznndsysnaxzo.supabase.co
PGPORT=5432
PGDATABASE=postgres

# Admin Configuration
ADMIN_PASSWORD=${newCredentials.adminPassword}

# Email Configuration (if using EmailJS)
VITE_EMAILJS_PUBLIC_KEY=<YOUR_EMAILJS_KEY_IF_NEEDED>`;

// Write template to file
const fs = require('fs');
fs.writeFileSync('.env.new-template', envTemplate);

console.log('\n✅ Template saved to .env.new-template');
console.log('   Update <NEW_ANON_KEY_FROM_SUPABASE> and <NEW_SERVICE_ROLE_KEY_FROM_SUPABASE> with values from Supabase dashboard');