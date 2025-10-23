/**
 * Test Logger Behavior
 * 
 * Run this in browser console to verify logger works correctly
 */

import { logger } from './logger'

export function testLogger() {
  console.group('🧪 Logger Test Suite')
  
  // Test 1: Basic logging
  console.log('📝 Test 1: Basic Logging')
  logger.debug('Debug message', { testId: 1 })
  logger.info('Info message', { testId: 1 })
  logger.warn('Warning message', { testId: 1 })
  logger.error('Error message', new Error('Test error'), { testId: 1 })
  
  // Test 2: Sensitive data sanitization
  console.log('\n📝 Test 2: Sensitive Data Sanitization')
  const sensitiveData = {
    email: 'user@example.com',
    access_token: 'secret123',
    password: 'mypassword',
    role: 'student',
    api_key: 'key123',
    secret: 'topsecret'
  }
  logger.info('User data with secrets', sensitiveData)
  console.log('↑ All sensitive fields should show [REDACTED]')
  
  // Test 3: Nested object sanitization
  console.log('\n📝 Test 3: Nested Object Sanitization')
  const nestedData = {
    user: {
      email: 'user@example.com',
      credentials: {
        token: 'secret-token',
        password: 'password123'
      }
    }
  }
  logger.info('Nested sensitive data', nestedData)
  console.log('↑ Nested token/password should show [REDACTED]')
  
  // Test 4: Environment check
  console.log('\n📝 Test 4: Environment Detection')
  console.log('MODE:', import.meta.env.MODE)
  console.log('DEV:', import.meta.env.DEV)
  console.log('Hostname:', window.location.hostname)
  console.log('Expected: Logs visible if development or localhost')
  console.log('Expected: Logs hidden if production')
  
  // Test 5: Performance timing
  console.log('\n📝 Test 5: Performance Timing')
  logger.time('test-operation')
  setTimeout(() => {
    logger.timeEnd('test-operation')
    console.log('↑ Should show timing in development only')
  }, 100)
  
  // Test 6: Grouping
  console.log('\n📝 Test 6: Log Grouping')
  logger.group('Test Group', () => {
    logger.info('Message 1 inside group')
    logger.info('Message 2 inside group')
    logger.info('Message 3 inside group')
  })
  
  // Test 7: Table
  console.log('\n📝 Test 7: Table Logging')
  const users = [
    { id: 1, name: 'Alice', token: 'secret1' },
    { id: 2, name: 'Bob', token: 'secret2' },
  ]
  logger.table(users)
  console.log('↑ Should show table with [REDACTED] tokens')
  
  console.groupEnd()
  
  return '✅ Logger tests completed! Check output above.'
}

// Auto-run in development
if (import.meta.env.DEV) {
  console.log('💡 Tip: Run testLogger() in console to test logging')
}
