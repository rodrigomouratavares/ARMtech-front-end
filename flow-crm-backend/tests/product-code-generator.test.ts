import { describe, it, expect, beforeEach } from 'vitest';
import { ProductCodeGenerator } from '../src/services/product-code-generator.service';

describe('ProductCodeGenerator', () => {
    let generator: ProductCodeGenerator;

    beforeEach(() => {
        generator = new ProductCodeGenerator();
    });

    describe('Code Format Validation', () => {
        it('should validate correct PROD code format', () => {
            expect(generator.validateCodeFormat('PROD0000001')).toBe(true);
            expect(generator.validateCodeFormat('PROD0000123')).toBe(true);
            expect(generator.validateCodeFormat('PROD9999999')).toBe(true);
        });

        it('should reject invalid code formats', () => {
            expect(generator.validateCodeFormat('PROD001')).toBe(false); // Too short
            expect(generator.validateCodeFormat('PROD00000001')).toBe(false); // Too long
            expect(generator.validateCodeFormat('PRODUCT0000001')).toBe(false); // Wrong prefix
            expect(generator.validateCodeFormat('PROD000000A')).toBe(false); // Non-numeric
            expect(generator.validateCodeFormat('')).toBe(false); // Empty
            expect(generator.validateCodeFormat('invalid')).toBe(false); // Invalid format
        });
    });

    describe('Sequence Number Extraction', () => {
        it('should extract sequence numbers from valid codes', () => {
            expect(generator.extractSequenceNumber('PROD0000001')).toBe(1);
            expect(generator.extractSequenceNumber('PROD0000123')).toBe(123);
            expect(generator.extractSequenceNumber('PROD9999999')).toBe(9999999);
        });

        it('should return 0 for invalid codes', () => {
            expect(generator.extractSequenceNumber('PROD001')).toBe(0);
            expect(generator.extractSequenceNumber('INVALID')).toBe(0);
            expect(generator.extractSequenceNumber('')).toBe(0);
        });
    });

    describe('Code Formatting', () => {
        it('should format sequence numbers correctly', () => {
            expect(generator.formatCode(1)).toBe('PROD0000001');
            expect(generator.formatCode(123)).toBe('PROD0000123');
            expect(generator.formatCode(9999999)).toBe('PROD9999999');
        });

        it('should throw error for invalid sequence numbers', () => {
            expect(() => generator.formatCode(0)).toThrow('Sequence number must be between 1 and 9999999');
            expect(() => generator.formatCode(-1)).toThrow('Sequence number must be between 1 and 9999999');
            expect(() => generator.formatCode(10000000)).toThrow('Sequence number must be between 1 and 9999999');
        });
    });
});