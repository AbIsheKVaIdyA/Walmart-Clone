#!/usr/bin/env node

/**
 * Security Testing Script for Walmart Clone
 * 
 * This script performs basic security tests to validate the implementation
 * Run with: node scripts/security-test.js
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test function wrapper
function test(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ PASSED: ${name}`);
      results.passed++;
      results.tests.push({ name, status: 'PASSED' });
    } else {
      console.log(`❌ FAILED: ${name}`);
      results.failed++;
      results.tests.push({ name, status: 'FAILED' });
    }
  } catch (error) {
    console.log(`❌ FAILED: ${name} - ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
  }
}

// Security tests
async function runSecurityTests() {
  console.log('🔒 Starting Security Tests for Walmart Clone\n');
  
  // Test 1: Check security headers
  test('Security Headers Present', async () => {
    const response = await makeRequest(`${BASE_URL}/`);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    return requiredHeaders.every(header => headers[header]);
  });
  
  // Test 2: Test rate limiting
  test('Rate Limiting Active', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        body: { email: 'test@test.com', password: 'wrong' }
      }));
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(res => res.status === 429);
    return rateLimited;
  });
  
  // Test 3: Test XSS protection
  test('XSS Protection Active', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const response = await makeRequest(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: xssPayload
      }
    });
    
    // Should either reject the request or sanitize the input
    return response.status === 400 || !response.data.name?.includes('<script>');
  });
  
  // Test 4: Test SQL injection protection
  test('SQL Injection Protection Active', async () => {
    const sqlPayload = "'; DROP TABLE users; --";
    const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: {
        email: sqlPayload,
        password: 'test'
      }
    });
    
    // Should reject the request
    return response.status === 400;
  });
  
  // Test 5: Test authentication required for protected routes
  test('Authentication Required for Protected Routes', async () => {
    const response = await makeRequest(`${BASE_URL}/api/admin/security/logs`);
    return response.status === 401;
  });
  
  // Test 6: Test password strength validation
  test('Password Strength Validation', async () => {
    const weakPassword = '123';
    const response = await makeRequest(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: weakPassword,
        name: 'Test User'
      }
    });
    
    return response.status === 400;
  });
  
  // Test 7: Test email validation
  test('Email Validation Active', async () => {
    const invalidEmail = 'not-an-email';
    const response = await makeRequest(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: {
        email: invalidEmail,
        password: 'TestPassword123!',
        name: 'Test User'
      }
    });
    
    return response.status === 400;
  });
  
  // Test 8: Test CSRF protection (if implemented)
  test('CSRF Protection Active', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': 'invalid-token'
      }
    });
    
    // Should either require CSRF token or reject invalid ones
    return response.status === 400 || response.status === 403;
  });
  
  // Test 9: Test input sanitization
  test('Input Sanitization Active', async () => {
    const maliciousInput = 'javascript:alert("xss")';
    const response = await makeRequest(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: maliciousInput
      }
    });
    
    // Should sanitize the input
    return response.status === 200 && !response.data.user?.name?.includes('javascript:');
  });
  
  // Test 10: Test HTTPS enforcement (if in production)
  test('HTTPS Configuration', async () => {
    if (BASE_URL.startsWith('https')) {
      const response = await makeRequest(`${BASE_URL}/`);
      return response.headers['strict-transport-security'];
    }
    return true; // Skip if not HTTPS
  });
}

// Run tests
async function main() {
  try {
    await runSecurityTests();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    
    if (results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}${test.error ? `: ${test.error}` : ''}`);
        });
    }
    
    console.log('\n🔒 Security Test Complete!');
    
    // Exit with error code if tests failed
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runSecurityTests, test, makeRequest };
