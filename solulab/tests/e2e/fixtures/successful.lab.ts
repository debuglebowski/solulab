import { createSolutionLab } from 'solulab';
import { z } from 'zod';

export const lab__successful = createSolutionLab({
    name: 'Successful Test Lab',
    description: 'A lab where all tests pass',

    paramSchema: z.object({
        input: z.number(),
    }),

    resultSchema: z.object({
        output: z.number(),
    }),

    versions: [
        {
            name: 'double',
            execute({ input }) {
                return { output: input * 2 };
            },
        },
        {
            name: 'triple',
            execute({ input }) {
                return { output: input * 3 };
            },
        },
    ],

    cases: [
        {
            name: 'small',
            arguments: { input: 5 },
        },
        {
            name: 'large',
            arguments: { input: 100 },
        },
    ],
});
