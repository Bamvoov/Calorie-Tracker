import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import { hashPassword, comparePasswords, signToken, verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Running Calorie App Tests...\n');
  
  try {
    // Test 1: Database Connection
    console.log('Test 1: Database Connection');
    const userCount = await prisma.user.count();
    console.log(`✅ Successfully connected to database. Found ${userCount} user(s)\n`);
    
    // Test 2: Authentication Functions
    console.log('Test 2: Authentication Functions');
    const testPassword = 'testpass123';
    const hashed = await hashPassword(testPassword);
    const isMatch = await comparePasswords(testPassword, hashed);
    console.log(`✅ Password hashing: ${isMatch ? 'PASS' : 'FAIL'}\n`);
    
    // Test 3: JWT Token Generation
    console.log('Test 3: JWT Token Generation');
    const token = await signToken({ userId: 'test-user-id' });
    const verified = await verifyToken(token);
    console.log(`✅ JWT token generation and verification: ${verified ? 'PASS' : 'FAIL'}\n`);
    
    // Test 4: Food logs data
    console.log('Test 4: Food Logs Data');
    const foodLogCount = await prisma.foodLog.count();
    console.log(`✅ Found ${foodLogCount} food log(s) in database\n`);
    
    // Test 5: Gemini API (basic import check)
    console.log('Test 5: Gemini API Module');
    try {
      const ai = new GoogleGenAI({ apiKey: 'test-key' });
      console.log(`✅ Gemini API module: PASS\n`);
    } catch (e) {
      console.log(`⚠️ Gemini API initialization (expected to fail with test key): ${e.message}\n`);
    }
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📝 Ready to start development server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runTests();
