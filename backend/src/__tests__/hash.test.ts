/**
 * Tests for hash utility functions
 */
import { hashSha256, hashEssential } from '../utils/hash.js';

describe('hashSha256', () => {
    test('should return consistent hash for same string input', () => {
        const input = 'test string';
        const hash1 = hashSha256(input);
        const hash2 = hashSha256(input);

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    test('should return different hash for different inputs', () => {
        const hash1 = hashSha256('input1');
        const hash2 = hashSha256('input2');

        expect(hash1).not.toBe(hash2);
    });

    test('should handle object input by stringifying', () => {
        const obj = { key: 'value', num: 123 };
        const hash = hashSha256(obj);

        expect(hash).toHaveLength(64);
    });

    test('should produce known hash for known input', () => {
        // SHA-256 of "hello" is well-known
        const hash = hashSha256('hello');
        expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });
});

describe('hashEssential', () => {
    test('should return consistent hash regardless of key order', () => {
        const obj1 = { a: 1, b: 2, c: 3 };
        const obj2 = { c: 3, a: 1, b: 2 };

        const hash1 = hashEssential(obj1);
        const hash2 = hashEssential(obj2);

        expect(hash1).toBe(hash2);
    });

    test('should return different hash for different values', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { a: 1, b: 3 };

        const hash1 = hashEssential(obj1);
        const hash2 = hashEssential(obj2);

        expect(hash1).not.toBe(hash2);
    });
});
