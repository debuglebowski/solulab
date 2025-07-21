import crypto from 'node:crypto';
import { createSolutionLab } from 'solulab';
import { z } from 'zod';

export const lab__random_string = createSolutionLab({
    name: 'Random String Generator',
    description: 'Generates random strings using different algorithms and character sets',

    paramSchema: z.object({
        length: z.number().int().min(1).max(1000),
        charset: z.enum(['alphanumeric', 'alpha', 'numeric']).default('alphanumeric'),
    }),

    resultSchema: z.string(),

    versions: [
        {
            name: 'Math.random',
            execute({ length, charset }) {
                let chars = '';

                switch (charset) {
                    case 'alpha':
                        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                        break;
                    case 'numeric':
                        chars = '0123456789';
                        break;
                    default:
                        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                }

                let result = '';

                for (let i = 0; i < length; i++) {
                    result += chars.charAt(Math.floor(Math.random() * chars.length));
                }

                return result;
            },
        },
        {
            name: 'crypto-based',
            execute({ length, charset }) {
                let chars = '';

                switch (charset) {
                    case 'alpha':
                        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                        break;
                    case 'numeric':
                        chars = '0123456789';
                        break;
                    default:
                        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                }

                let result = '';
                const randomBytes = crypto.randomBytes(length);

                for (let i = 0; i < length; i++) {
                    result += chars[randomBytes[i] % chars.length];
                }

                return result;
            },
        },
    ],

    cases: [
        {
            name: 'short numeric',
            arguments: { length: 6, charset: 'numeric' },
        },
        {
            name: 'medium alpha',
            arguments: { length: 16, charset: 'alpha' },
        },
        {
            name: 'long alphanumeric',
            arguments: { length: 32, charset: 'alphanumeric' },
        },
        {
            name: 'uuid length',
            arguments: { length: 36, charset: 'alphanumeric' },
        },
    ],
});
