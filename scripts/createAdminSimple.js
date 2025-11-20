/**
 * Simple script to generate SQL for creating an admin user
 * This script generates the SQL you need to run in Supabase
 * 
 * Usage:
 *   node scripts/createAdminSimple.js
 *   node scripts/createAdminSimple.js admin@walmart.com "Admin User" "Admin123!"
 */

const bcrypt = require('bcryptjs');

async function generateAdminSQL() {
  const email = process.argv[2] || 'admin@walmart.com';
  const name = process.argv[3] || 'Admin User';
  const password = process.argv[4] || 'Admin123!';

  console.log('\n🔐 Creating Admin User SQL...\n');
  console.log('Email:', email);
  console.log('Name:', name);
  console.log('Password:', '*'.repeat(password.length));
  console.log('\n⏳ Hashing password...\n');

  try {
    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('✅ Password hashed successfully!\n');
    console.log('📋 Copy and run this SQL in Supabase SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(`
INSERT INTO users (email, name, password, role)
VALUES (
  '${email}',
  '${name}',
  '${hashedPassword}',
  'admin'
);
    `);
    console.log('─'.repeat(60));
    console.log('\n📝 Steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the SQL above');
    console.log('3. Paste and run it');
    console.log('4. Go to http://localhost:3000/admin/login');
    console.log('5. Login with:', email, 'and your password\n');
    console.log('⚠️  Remember to change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateAdminSQL();




