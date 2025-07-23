import { createSolutionLab } from 'solulab';
import { z } from 'zod';

export const lab__failing = createSolutionLab({
    name: 'Failing Test Lab',
    description: 'A lab where some tests fail',

    paramSchema: z.object({
        shouldFail: z.boolean(),
    }),

    resultSchema: z.object({
        status: z.string(),
    }),

    versions: [
        {
            name: 'sometimes-fails',
            execute({ shouldFail }) {
                if (shouldFail) {
                    throw new Error('Intentional failure');
                }

                return { status: 'success' };
            },
        },
        {
            name: 'always-works',
            execute() {
                return { status: 'success' };
            },
        },
    ],

    cases: [
        {
            name: 'pass',
            arguments: { shouldFail: false },
        },
        {
            name: 'fail',
            arguments: { shouldFail: true },
        },
    ],
});
