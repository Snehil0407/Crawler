// Simple test file to verify email validation logic
import { validateEmailDomain } from './utils';

// Test cases for email validation
const testCases = [
  // Valid emails
  { email: 'john.doe@company.com', expected: true, description: 'Corporate email' },
  { email: 'sarah.smith@university.edu', expected: true, description: 'Educational email' },
  { email: 'developer@startup.io', expected: true, description: 'Professional email' },
  { email: 'realuser123@gmail.com', expected: true, description: 'Valid Gmail' },
  
  // Invalid emails - generic patterns
  { email: 'demo@gmail.com', expected: false, description: 'Generic demo Gmail' },
  { email: 'demo123@gmail.com', expected: false, description: 'Generic demo with numbers Gmail' },
  { email: 'test@gmail.com', expected: false, description: 'Generic test Gmail' },
  { email: 'test456@gmail.com', expected: false, description: 'Generic test with numbers Gmail' },
  { email: 'user@gmail.com', expected: false, description: 'Generic user Gmail' },
  { email: 'admin@gmail.com', expected: false, description: 'Generic admin Gmail' },
  { email: '123@gmail.com', expected: false, description: 'Numbers only Gmail' },
  { email: 'temp@gmail.com', expected: false, description: 'Generic temp Gmail' },
  { email: 'fake@gmail.com', expected: false, description: 'Generic fake Gmail' },
  { email: 'sample@gmail.com', expected: false, description: 'Generic sample Gmail' },
  { email: 'example@gmail.com', expected: false, description: 'Generic example Gmail' },
  
  // Invalid emails - other domains with generic patterns
  { email: 'demo123@anywhere.com', expected: false, description: 'Generic demo pattern' },
  { email: 'test@anywhere.com', expected: false, description: 'Generic test pattern' },
  { email: '123@anywhere.com', expected: false, description: 'Numbers only pattern' },
  
  // Invalid email formats
  { email: 'invalid-email', expected: false, description: 'Invalid format' },
  { email: '@gmail.com', expected: false, description: 'Missing local part' },
  { email: 'user@', expected: false, description: 'Missing domain' },
];

console.log('🧪 Email Validation Tests\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateEmailDomain(testCase.email);
  const success = result.isValid === testCase.expected;
  
  console.log(`${success ? '✅' : '❌'} Test ${index + 1}: ${testCase.description}`);
  console.log(`   Email: ${testCase.email}`);
  console.log(`   Expected: ${testCase.expected ? 'Valid' : 'Invalid'}`);
  console.log(`   Result: ${result.isValid ? 'Valid' : 'Invalid'}`);
  if (!result.isValid && result.error) {
    console.log(`   Error: ${result.error}`);
  }
  console.log('');
  
  if (success) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`📊 Results: ${passed} passed, ${failed} failed`);
console.log(`✨ Success rate: ${Math.round((passed / testCases.length) * 100)}%`);

export default {};
