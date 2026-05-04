require('dotenv').config({ path: '.env.local' });

async function runTests() {
  console.log('--- Starting E2E Tests ---');
  
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';

  // 1. Signup
  console.log('\n[1] Testing Signup...');
  const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const signupData = await signupRes.json();
  if (signupRes.ok) {
    console.log('✅ Signup successful');
  } else {
    console.log('❌ Signup failed:', signupData);
    if (signupData.error !== 'Email already in use') {
      return;
    }
  }

  // 2. Login
  console.log('\n[2] Testing Login...');
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const loginData = await loginRes.json();
  let tokenCookie = '';
  if (loginRes.ok) {
    console.log('✅ Login successful');
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      tokenCookie = setCookie.split(';')[0];
    }
  } else {
    console.log('❌ Login failed:', loginData);
    return;
  }

  if (!tokenCookie) {
    console.log('❌ No token cookie received');
    return;
  }

  // 3. Log Food
  console.log('\n[3] Testing Log Food...');
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.log('❌ GEMINI_API_KEY not found in .env.local');
    return;
  }

  const logFoodRes = await fetch('http://localhost:3000/api/log-food', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': tokenCookie,
      'x-gemini-key': geminiKey
    },
    body: JSON.stringify({
      foodInput: '1 banana',
      mealType: 'snack',
      logDate: new Date().toISOString().split('T')[0]
    })
  });

  const logFoodData = await logFoodRes.json();
  if (logFoodRes.ok) {
    console.log('✅ Log Food successful');
    console.log('  -> Logged Item:', logFoodData.result.foodName);
    console.log('  -> Total Calories:', logFoodData.result.calories);
  } else {
    console.log('❌ Log Food failed:', logFoodData);
    return;
  }

  // 4. Fetch Daily Logs
  console.log('\n[4] Testing Fetch Daily Logs...');
  const dailyRes = await fetch('http://localhost:3000/api/daily', {
    method: 'GET',
    headers: {
      'Cookie': tokenCookie
    }
  });

  const dailyData = await dailyRes.json();
  if (dailyRes.ok) {
    console.log('✅ Fetch Daily Logs successful');
    console.log(`  -> Found ${dailyData.logs.length} log(s) for today.`);
    console.log(`  -> Total Calories Today: ${dailyData.totalCalories}`);
  } else {
    console.log('❌ Fetch Daily Logs failed:', dailyData);
  }

  console.log('\n--- All Tests Completed ---');
}

runTests();
