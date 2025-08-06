import { describe, expect, test } from 'bun:test';
import { isLongText } from './index';

describe('isLongText', () => {
    test('returns false for non-string values', () => {
        expect(isLongText(null)).toBe(false);
        expect(isLongText(undefined)).toBe(false);
        expect(isLongText(123)).toBe(false);
        expect(isLongText(true)).toBe(false);
        expect(isLongText(false)).toBe(false);
        expect(isLongText({})).toBe(false);
        expect(isLongText([])).toBe(false);
        expect(isLongText(() => {})).toBe(false);
        expect(isLongText(Symbol('test'))).toBe(false);
    });

    test('returns false for short strings without newlines', () => {
        expect(isLongText('')).toBe(false);
        expect(isLongText('a')).toBe(false);
        expect(isLongText('short')).toBe(false);
        expect(isLongText('This is a short string')).toBe(false);
        expect(isLongText('a'.repeat(50))).toBe(false);
        expect(isLongText('a'.repeat(100))).toBe(false); // Exactly 100 chars
    });

    test('returns true for strings longer than 100 characters', () => {
        expect(isLongText('a'.repeat(101))).toBe(true);
        expect(isLongText('a'.repeat(200))).toBe(true);
        expect(isLongText('a'.repeat(1000))).toBe(true);

        const longSentence =
            'This is a very long sentence that contains more than one hundred characters and should be detected as long text.';
        expect(longSentence.length).toBeGreaterThan(100);
        expect(isLongText(longSentence)).toBe(true);
    });

    test('returns true for strings containing newlines', () => {
        expect(isLongText('\n')).toBe(true);
        expect(isLongText('line1\nline2')).toBe(true);
        expect(isLongText('short\n')).toBe(true);
        expect(isLongText('\nstart')).toBe(true);
        expect(isLongText('multiple\nlines\nhere')).toBe(true);
        expect(isLongText('a\nb\nc\nd')).toBe(true);
    });

    test('returns true for multi-line strings regardless of total length', () => {
        expect(isLongText('a\nb')).toBe(true); // Very short but has newline
        expect(isLongText('line 1\nline 2\nline 3')).toBe(true);
        expect(
            isLongText(`
            This is a multi-line
            string with indentation
        `)
        ).toBe(true);
    });

    test('handles edge cases correctly', () => {
        // String with exactly 100 chars and no newline
        const exactly100 = 'x'.repeat(100);
        expect(exactly100.length).toBe(100);
        expect(isLongText(exactly100)).toBe(false);

        // String with exactly 101 chars
        const exactly101 = 'x'.repeat(101);
        expect(exactly101.length).toBe(101);
        expect(isLongText(exactly101)).toBe(true);

        // String with 100 chars and a newline
        const hundredWithNewline = 'x'.repeat(99) + '\n';
        expect(hundredWithNewline.length).toBe(100);
        expect(isLongText(hundredWithNewline)).toBe(true);
    });

    test('handles different types of line breaks', () => {
        expect(isLongText('line1\nline2')).toBe(true); // Unix
        expect(isLongText('line1\r\nline2')).toBe(true); // Windows (contains \n)
        expect(isLongText('line1\rline2')).toBe(false); // Old Mac (no \n, under 100 chars)

        // Carriage return only, but over 100 chars
        const longWithCR = 'x'.repeat(50) + '\r' + 'x'.repeat(51);
        expect(longWithCR.length).toBe(102);
        expect(isLongText(longWithCR)).toBe(true); // True because > 100 chars
    });

    test('handles empty strings and whitespace', () => {
        expect(isLongText('')).toBe(false);
        expect(isLongText(' ')).toBe(false);
        expect(isLongText('   ')).toBe(false);
        expect(isLongText('\t')).toBe(false);
        expect(isLongText(' '.repeat(100))).toBe(false);
        expect(isLongText(' '.repeat(101))).toBe(true);
        expect(isLongText(' \n ')).toBe(true);
    });
});
