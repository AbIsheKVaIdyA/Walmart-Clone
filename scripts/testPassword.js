/**
 * Test Password Hashing and Verification
 * 
 * Run this to test if bcrypt is working correctly:
 * node scripts/testPassword.js
 */

const bcrypt = require('bcryptjs');

async function testPassword() {
  const plainPassword = process.argv[2] || 'TestPassword123!';
  const hashFromDB = process.argv[3]; // Optional: test against existing hash
  
  console.log('\n🔐 Password Hashing Test\n');
  console.log('Plain password:', plainPassword);
  console.log('Password length:', plainPassword.length);
  
  // Hash the password
  const hash = await bcrypt.hash(plainPassword, 12);
  console.log('\n✅ Generated Hash:');
  console.log('Hash:', hash);
  console.log('Hash length:', hash.length);
  console.log('Hash starts with:', hash.substring(0, 20));
  
  // Verify the password
  const isValid = await bcrypt.compare(plainPassword, hash);
  console.log('\n✅ Verification Result:');
  console.log('Password matches hash:', isValid);
  
  // If hash from DB provided, test against it
  if (hashFromDB) {
    console.log('\n🔍 Testing against provided hash from database:');
    console.log('DB Hash:', hashFromDB.substring(0, 30) + '...');
    const matchesDB = await bcrypt.compare(plainPassword, hashFromDB);
    console.log('Password matches DB hash:', matchesDB);
    
    if (!matchesDB) {
      console.log('\n❌ ERROR: Password does NOT match database hash!');
      console.log('This means either:');
      console.log('  1. The password stored in DB is different');
      console.log('  2. The password was hashed with different salt rounds');
      console.log('  3. The password field in DB is corrupted');
    }
  }
  
  console.log('\n');
}

testPassword().catch(console.error);



