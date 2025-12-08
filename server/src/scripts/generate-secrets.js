import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';

function generateSecret(length = 64) {
  return randomBytes(length).toString('hex');
}

function generateKeys() {
  const secrets = {
    // Stripe
    STRIPE_WEBHOOK_SECRET: generateSecret(32),

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
#STRIPE WEBHOOK SECRET
STRIPE_WEBHOOK_SECRET="stripe_webhook_secret_here"

#session
SESSION_SECRET="session_secret_here"

# Cookie Configuration
COOKIE_SECRET=dev_cookie_secret_12345

`;

// Create development .env
const envDev = `
#STRIPE WEBHOOK SECRET
STRIPE_WEBHOOK_SECRET="${devSecrets.STRIPE_WEBHOOK_SECRET}"

#session
SESSION_SECRET="${devSecrets.SESSION_SECRET}"

# Cookie Configuration
COOKIE_SECRET="${devSecrets.COOKIE_SECRET}"

`;

// Create production .env (you should manually fill sensitive production values)
const envProd = `
#STRIPE WEBHOOK SECRET
STRIPE_WEBHOOK_SECRET="${prodSecrets.STRIPE_WEBHOOK_SECRET}"

#session
SESSION_SECRET="${prodSecrets.SESSION_SECRET}"

# Cookie Configuration
COOKIE_SECRET="${prodSecrets.COOKIE_SECRET}"

`;

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
