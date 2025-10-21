import { describe, it, expect } from 'vitest';
import { validateCpf, formatCpf, cleanCpf } from '../src/utils/cpf-cnpj-validator.js';
import { hashPassword, comparePassword } from '../src/utils/password-hash.js';
import { generateToken, verifyToken, extractTokenFromHeader, isTokenExpired } from '../src/utils/jwt.js';

describe('CPF Validation Utilities', () => {
  it('should validate correct CPF', () => {
    expect(validateCpf('123.456.789-09')).toBe(true);
    expect(validateCpf('12345678909')).toBe(true);
  });

  it('should reject invalid CPF', () => {
    expect(validateCpf('123.456.789-00')).toBe(false);
    expect(validateCpf('111.111.111-11')).toBe(false);
    expect(validateCpf('123')).toBe(false);
    expect(validateCpf('')).toBe(false);
  });

  it('should format CPF correctly', () => {
    expect(formatCpf('12345678909')).toBe('123.456.789-09');
  });

  it('should clean CPF correctly', () => {
    expect(cleanCpf('123.456.789-09')).toBe('12345678909');
  });
});

describe('Password Hashing Utilities', () => {
  it('should hash password', async () => {
    const password = 'testpassword123';
    const hashed = await hashPassword(password);
    
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(50);
  });

  it('should compare passwords correctly', async () => {
    const password = 'testpassword123';
    const hashed = await hashPassword(password);
    
    expect(await comparePassword(password, hashed)).toBe(true);
    expect(await comparePassword('wrongpassword', hashed)).toBe(false);
  });
});

describe('JWT Utilities', () => {
  const testPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'employee' as const,
  };

  it('should generate and verify JWT token', async () => {
    const token = await generateToken(testPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = await verifyToken(token);
    expect(decoded.userId).toBe(testPayload.userId);
    expect(decoded.email).toBe(testPayload.email);
    expect(decoded.role).toBe(testPayload.role);
  });

  it('should extract token from Authorization header', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const authHeader = `Bearer ${token}`;
    
    expect(extractTokenFromHeader(authHeader)).toBe(token);
    expect(extractTokenFromHeader('Invalid header')).toBe(null);
    expect(extractTokenFromHeader(undefined)).toBe(null);
  });

  it('should detect expired tokens', () => {
    // This is a mock expired token for testing
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDk0NTkyMDB9.invalid';
    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(isTokenExpired('invalid-token')).toBe(true);
  });
});