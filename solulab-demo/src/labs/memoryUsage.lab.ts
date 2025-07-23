import * as os from 'node:os';
import { createSolutionLab } from 'solulab';
import { z } from 'zod';

export const lab__memory_usage = createSolutionLab({
    name: 'Memory Usage',
    description: 'Monitors system memory usage with different calculation methods',

    paramSchema: z.object({
        includeBuffers: z.boolean().optional().default(false),
    }),

    resultSchema: z.object({
        totalMB: z.number(),
        freeMB: z.number(),
        usedMB: z.number(),
        usagePercent: z.number(),
    }),

    versions: [
        {
            name: 'basic calculation',
            execute() {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;

                return {
                    totalMB: Math.round(totalMem / 1024 / 1024),
                    freeMB: Math.round(freeMem / 1024 / 1024),
                    usedMB: Math.round(usedMem / 1024 / 1024),
                    usagePercent: Math.round((usedMem / totalMem) * 100),
                };
            },
        },
        {
            name: 'precise calculation',
            execute() {
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;

                // More precise calculations with 2 decimal places
                return {
                    totalMB: Number((totalMem / 1024 / 1024).toFixed(2)),
                    freeMB: Number((freeMem / 1024 / 1024).toFixed(2)),
                    usedMB: Number((usedMem / 1024 / 1024).toFixed(2)),
                    usagePercent: Number(((usedMem / totalMem) * 100).toFixed(2)),
                };
            },
        },
    ],

    cases: [
        {
            name: 'default',
            arguments: { includeBuffers: false },
        },
        {
            name: 'with buffers',
            arguments: { includeBuffers: true },
        },
    ],
});
