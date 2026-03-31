#!/usr/bin/env node

/**
 * Test signup endpoint
 */

async function testSignup() {
  console.log('🧪 Testing Signup API...\n');

  try {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}\n`);

    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Signup successful!');
    } else {
      console.log('\n❌ Signup failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSignup();
