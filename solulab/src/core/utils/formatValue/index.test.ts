import { describe, expect, test } from 'bun:test';
import { formatValue } from './index';

describe('formatValue', () => {
    test('formats strings as-is', () => {
        expect(formatValue('hello')).toBe('hello');
        expect(formatValue('Hello World')).toBe('Hello World');
        expect(formatValue('')).toBe('');
        expect(formatValue('123')).toBe('123');
        expect(formatValue('true')).toBe('true');
        expect(formatValue('null')).toBe('null');
        expect(formatValue('undefined')).toBe('undefined');
        expect(formatValue('{"key": "value"}')).toBe('{"key": "value"}');
    });

    test('formats numbers as strings', () => {
        expect(formatValue(0)).toBe('0');
        expect(formatValue(123)).toBe('123');
        expect(formatValue(-456)).toBe('-456');
        expect(formatValue(3.14159)).toBe('3.14159');
        expect(formatValue(1.23e10)).toBe('12300000000');
        expect(formatValue(Infinity)).toBe('Infinity');
        expect(formatValue(-Infinity)).toBe('-Infinity');
        expect(formatValue(NaN)).toBe('NaN');
    });

    test('formats booleans as string literals', () => {
        expect(formatValue(true)).toBe('true');
        expect(formatValue(false)).toBe('false');
    });

    test('formats null as JSON', () => {
        expect(formatValue(null)).toBe('null');
    });

    test('formats undefined as JSON', () => {
        expect(formatValue(undefined)).toBeUndefined();
    });

    test('formats objects as pretty JSON', () => {
        const obj = { key: 'value', number: 42 };
        const expected = JSON.stringify(obj, null, 2);
        expect(formatValue(obj)).toBe(expected);
    });

    test('formats arrays as pretty JSON', () => {
        const arr = [1, 2, 3, 'four'];
        const expected = JSON.stringify(arr, null, 2);
        expect(formatValue(arr)).toBe(expected);
    });

    test('formats nested objects as pretty JSON', () => {
        const nested = {
            level1: {
                level2: {
                    level3: 'deep value',
                    array: [1, 2, 3],
                },
                sibling: 'value',
            },
        };
        const expected = JSON.stringify(nested, null, 2);
        expect(formatValue(nested)).toBe(expected);
    });

    test('handles complex types', () => {
        // Function
        const fn = () => 'test';
        expect(formatValue(fn)).toBeUndefined(); // Functions become undefined in JSON.stringify

        // Symbol
        const sym = Symbol('test');
        expect(formatValue(sym)).toBeUndefined(); // Symbols become undefined in JSON.stringify

        // Date
        const date = new Date('2024-01-01T00:00:00Z');
        expect(formatValue(date)).toBe('"2024-01-01T00:00:00.000Z"');

        // RegExp
        const regex = /test/gi;
        expect(formatValue(regex)).toBe('{}'); // RegExp becomes empty object in JSON.stringify

        // Map
        const map = new Map([['key', 'value']]);
        expect(formatValue(map)).toBe('{}'); // Map becomes empty object in JSON.stringify

        // Set
        const set = new Set([1, 2, 3]);
        expect(formatValue(set)).toBe('{}'); // Set becomes empty object in JSON.stringify
    });

    test('handles circular references', () => {
        const obj: any = { name: 'circular' };
        obj.self = obj;

        // JSON.stringify throws on circular references
        expect(() => formatValue(obj)).toThrow();
    });

    test('preserves JSON formatting with 2-space indentation', () => {
        const obj = {
            a: 1,
            b: 2,
        };
        const result = formatValue(obj);

        expect(result).toContain('{\n');
        expect(result).toContain('  "a": 1');
        expect(result).toContain('  "b": 2');
        expect(result).toContain('\n}');
    });

    test('handles empty objects and arrays', () => {
        expect(formatValue({})).toBe('{}');
        expect(formatValue([])).toBe('[]');
    });

    test('handles objects with undefined values', () => {
        const obj = {
            defined: 'value',
            notDefined: undefined,
            alsoDefinded: 'another',
        };
        const result = formatValue(obj);

        // undefined values are omitted in JSON.stringify
        expect(result).not.toContain('notDefined');
        expect(result).toContain('defined');
        expect(result).toContain('alsoDefinded');
    });
});
