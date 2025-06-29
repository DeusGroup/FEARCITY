/**
 * Basic Test v0.1.6
 * Simple test to verify test setup is working
 */

import { describe, it, expect } from '@jest/globals';

describe('Basic Tests', () => {
  it('should run basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should run string test', () => {
    expect('hello world').toContain('world');
  });

  it('should test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should test async function', async () => {
    const promise = Promise.resolve('test value');
    const result = await promise;
    expect(result).toBe('test value');
  });
});