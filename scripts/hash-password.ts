/**
 * CLI script to generate bcrypt password hashes for Mithril users
 *
 * Usage:
 *   npx tsx scripts/hash-password.ts "your-password"
 *
 * Then copy the hash to Firestore when creating a user document.
 */

import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: npx tsx scripts/hash-password.ts "your-password"');
    console.error('');
    console.error('Example:');
    console.error('  npx tsx scripts/hash-password.ts "mysecretpassword123"');
    process.exit(1);
  }

  console.log('Generating bcrypt hash...');
  console.log('');

  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);

  console.log('Password hash (copy this to Firestore):');
  console.log('');
  console.log(hash);
  console.log('');
  console.log('---');
  console.log('');
  console.log('To create a user in Firestore, add a document to "mithrilUsers" collection with:');
  console.log('');
  console.log('{');
  console.log('  "email": "user@example.com",');
  console.log(`  "passwordHash": "${hash}",`);
  console.log('  "displayName": "User Name",');
  console.log('  "role": "admin",  // or "user"');
  console.log('  "isActive": true,');
  console.log('  "createdAt": (server timestamp),');
  console.log('  "createdBy": "manual",');
  console.log('  "lastLoginAt": null');
  console.log('}');
}

main();