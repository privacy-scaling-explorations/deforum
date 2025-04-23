const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET:', JWT_SECRET.slice(0, 5), "...");

// Service Role Token
const serviceRolePayload = {
  role: 'service_role',
  iss: 'postgrest',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (5 * 365 * 24 * 60 * 60) // 5 years
};

const serviceRoleKey = jwt.sign(serviceRolePayload, JWT_SECRET, { algorithm: 'HS256' });
console.log('\nGenerated Service Role Key:', serviceRoleKey);
console.log('Decoded Service Role token:', jwt.decode(serviceRoleKey));

// Anon Token
const anonPayload = {
  role: 'anon',
  iss: 'postgrest',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (5 * 365 * 24 * 60 * 60) // 5 years
};

const anonKey = jwt.sign(anonPayload, JWT_SECRET, { algorithm: 'HS256' });
console.log('\nGenerated Anon Key:', anonKey);
console.log('Decoded Anon token:', jwt.decode(anonKey));

console.log('\n--------------------------------');
console.log('Add these to your .env file:');
console.log(`SUPABASE_ANON_KEY=${anonKey}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);
console.log('--------------------------------');