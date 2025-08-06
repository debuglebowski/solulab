import { describe, expect, test } from 'bun:test';
import { formatDuration } from './index';

describe('formatDuration', () => {
    test('formats milliseconds under 1000ms', () => {
        expect(formatDuration(0)).toBe('0ms');
        expect(formatDuration(1)).toBe('1ms');
        expect(formatDuration(999)).toBe('999ms');
        expect(formatDuration(500)).toBe('500ms');
        expect(formatDuration(42)).toBe('42ms');
    });

    test('formats values at exactly 1000ms', () => {
        expect(formatDuration(1000)).toBe('1.00s');
    });

    test('formats seconds for values over 1000ms', () => {
        expect(formatDuration(1001)).toBe('1.00s');
        expect(formatDuration(1500)).toBe('1.50s');
        expect(formatDuration(2000)).toBe('2.00s');
        expect(formatDuration(5250)).toBe('5.25s');
        expect(formatDuration(10000)).toBe('10.00s');
        expect(formatDuration(99999)).toBe('100.00s');
    });

    test('formats with exactly 2 decimal places for seconds', () => {
        expect(formatDuration(1234)).toBe('1.23s');
        expect(formatDuration(1235)).toBe('1.24s'); // Should round
        expect(formatDuration(1999)).toBe('2.00s'); // Should round
        expect(formatDuration(3333)).toBe('3.33s');
        expect(formatDuration(3336)).toBe('3.34s'); // Should round
    });

    test('handles large values correctly', () => {
        expect(formatDuration(60000)).toBe('60.00s'); // 1 minute
        expect(formatDuration(120000)).toBe('120.00s'); // 2 minutes
        expect(formatDuration(3600000)).toBe('3600.00s'); // 1 hour
    });

    test('handles edge cases', () => {
        expect(formatDuration(999.4)).toBe('999.4ms'); // Just under 1s threshold
        expect(formatDuration(999.5)).toBe('999.5ms'); // Still under 1000ms threshold
        expect(formatDuration(999.9)).toBe('999.9ms'); // Still under 1000ms threshold
    });
});
