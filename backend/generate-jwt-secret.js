// backend/generate-jwt-secret.js
// Run this script to generate a secure JWT secret for your .env file

const crypto = require('crypto');

console.log('\n🔐 JWT Secret Generator\n');
console.log('Copy one of these secure secrets to your .env file:\n');

// Generate 3 different secrets
for (let i = 1; i <= 3; i++) {
  const secret = crypto.randomBytes(64).toString('hex');
  console.log(`Option ${i}:`);
  console.log(`JWT_SECRET=${secret}\n`);
}

console.log('💡 Tip: Use a different secret for production!\n');
