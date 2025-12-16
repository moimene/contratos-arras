/**
 * Tests for canonical JSON utility
 */
import { canonicalize } from '../utils/canonical.js';

describe('canonicalize', () => {
    test('should sort object keys alphabetically', () => {
        const input = { z: 1, a: 2, m: 3 };
        const result = canonicalize(input);

        expect(result).toBe('{"a":2,"m":3,"z":1}');
    });

    test('should handle nested objects', () => {
        const input = { outer: { z: 1, a: 2 }, first: 'value' };
        const result = canonicalize(input);

        expect(result).toBe('{"first":"value","outer":{"a":2,"z":1}}');
    });

    test('should handle arrays preserving order', () => {
        const input = { arr: [3, 1, 2], key: 'value' };
        const result = canonicalize(input);

        expect(result).toBe('{"arr":[3,1,2],"key":"value"}');
    });

    test('should handle null values', () => {
        const input = { a: null, b: 'value' };
        const result = canonicalize(input);

        expect(result).toBe('{"a":null,"b":"value"}');
    });

    test('should handle undefined by converting to null', () => {
        const input = { a: undefined, b: 'value' };
        const result = canonicalize(input);

        // undefined in object becomes null in our implementation
        expect(result).toBe('{"a":null,"b":"value"}');
    });

    test('should produce same output for different key order inputs', () => {
        const input1 = { z: 1, a: 2 };
        const input2 = { a: 2, z: 1 };

        expect(canonicalize(input1)).toBe(canonicalize(input2));
    });

    test('should handle deeply nested structures', () => {
        const input = {
            level1: {
                level2: {
                    z: 'last',
                    a: 'first'
                }
            }
        };
        const result = canonicalize(input);

        expect(result).toBe('{"level1":{"level2":{"a":"first","z":"last"}}}');
    });
});
