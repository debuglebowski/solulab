import { createSolutionLab } from 'solulab';
import { z } from 'zod';

export const lab__error = createSolutionLab({
    name: 'Error Test Lab',
    description: 'A lab that throws errors during execution',

    paramSchema: z.object({
        errorType: z.enum(['sync', 'async']),
    }),

    resultSchema: z.object({
        value: z.string(),
    }),

    versions: [
        {
            name: 'throw-sync',
            execute({ errorType }) {
                if (errorType === 'sync') {
                    throw new Error('Synchronous error');
                }

                return { value: 'ok' };
            },
        },
        {
            name: 'throw-async',
            async execute({ errorType }) {
                if (errorType === 'async') {
                    throw new Error('Asynchronous error');
                }

                return { value: 'ok' };
            },
        },
    ],

    cases: [
        {
            name: 'sync-error',
            arguments: { errorType: 'sync' },
        },
        {
            name: 'async-error',
            arguments: { errorType: 'async' },
        },
    ],
});
