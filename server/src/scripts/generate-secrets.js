import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';

function generateSecret(length = 64) {
  return randomBytes(length).toString('hex');
}

function generateKeys() {
  const secrets = {
    // Stripe
    STRIPE_WEBHOOK_SECRET: `whsec_live_${generateSecret(32)}`,
    STRIPE_PUBLISHABLE_KEY: `pk_live_${generateSecret(32)}`,
    STRIPE_SECRET_KEY: `sk_live_${generateSecret(32)}`,

    // google analytics
    GOOGLE_ANALYTICS_ID: `UA-${generateSecret(8)}`,
    // rtmp
    RTMP_SECRET: generateSecret(16),

    // Session
    SESSION_SECRET: generateSecret(32),

    // Cookie
    COOKIE_SECRET: generateSecret(32)
  };

  return secrets;
}

// Generate development and production secrets
const devSecrets = generateKeys();
const prodSecrets = generateKeys();

// Create .env.example with placeholder values
const envExample = `
#STRIPE API KEYS
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_live_XXXXXXXXXXXXXXXXXXXXXXXX

#RTMP SECRET
RTMP_SECRET=your_stream_auth_secret_change_this

#GOOGLE ANALYTICS ID
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X

#session
SESSION_SECRET="session_secret_here"

# Cookie Configuration
COOKIE_SECRET=dev_cookie_secret_12345

`;

// Create development .env
const envDev = `
#STRIPE WEBHOOK SECRET
STRIPE_WEBHOOK_SECRET="${devSecrets.STRIPE_WEBHOOK_SECRET}"
STRIPE_PUBLISHABLE_KEY="${devSecrets.STRIPE_PUBLISHABLE_KEY}"
STRIPE_SECRET_KEY="${devSecrets.STRIPE_SECRET_KEY}"

#RTMP SECRET
RTMP_SECRET="${devSecrets.RTMP_SECRET}"

#GOOGLE ANALYTICS ID
GOOGLE_ANALYTICS_ID="${devSecrets.GOOGLE_ANALYTICS_ID}"

#session
SESSION_SECRET="${devSecrets.SESSION_SECRET}"

# Cookie Configuration
COOKIE_SECRET="${devSecrets.COOKIE_SECRET}"

`;

// Create production .env (you should manually fill sensitive production values)
// const envProd = `
// #STRIPE WEBHOOK SECRET
// STRIPE_WEBHOOK_SECRET="${prodSecrets.STRIPE_WEBHOOK_SECRET}"

// #session
// SESSION_SECRET="${prodSecrets.SESSION_SECRET}"

// # Cookie Configuration
// COOKIE_SECRET="${prodSecrets.COOKIE_SECRET}"

// `;

// Write files
writeFileSync('.env', envDev.trim());
writeFileSync('.env.production', envProd.trim());
console.log('✅ Secret files generated!');
console.log('📁 .env.example created - Use as template');
console.log('📁 .env created - For development');
console.log('📁 .env.production created - For production');

// Write files
writeFileSync('.env', envDev.trim());
writeFileSync('.env.production', envProd.trim());
console.log('✅ Secret files generated!');
console.log('📁 .env.example created - Use as template');
console.log('📁 .env created - For development');
console.log('📁 .env.production created - For production');
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('1. Manually set production .env with real API keys');
console.log('2. Never commit .env files to version control');
console.log('3. Add .env* to your .gitignore file');
