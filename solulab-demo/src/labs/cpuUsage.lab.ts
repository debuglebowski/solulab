import * as os from 'node:os';
import { createSolutionLab } from 'solulab';
import { z } from 'zod';

export const lab__cpu_usage = createSolutionLab({
    name: 'CPU Usage',
    description: 'Measures CPU usage over different sampling periods',

    paramSchema: z.object({
        sampleMs: z.number().int().positive(),
    }),

    resultSchema: z.object({
        cpuUsage: z.number(),
        cpuCount: z.number(),
    }),

    versions: [
        {
            name: 'naive average',
            async execute({ sampleMs }) {
                const start = os.cpus();
                await new Promise((r) => setTimeout(r, sampleMs));
                const end = os.cpus();
                // naive average diff calculation
                let totalDiff = 0;

                for (let i = 0; i < start.length; i++) {
                    const startCpu = start[i].times;
                    const endCpu = end[i].times;
                    const userDiff = endCpu.user - startCpu.user;
                    const systemDiff = endCpu.sys - startCpu.sys;
                    totalDiff += (userDiff + systemDiff) / sampleMs;
                }

                return {
                    cpuUsage: totalDiff / start.length,
                    cpuCount: start.length,
                };
            },
        },
        {
            name: 'weighted average',
            async execute({ sampleMs }) {
                const start = os.cpus();
                await new Promise((r) => setTimeout(r, sampleMs));
                const end = os.cpus();
                // weighted average giving more importance to user time
                let totalDiff = 0;

                for (let i = 0; i < start.length; i++) {
                    const startCpu = start[i].times;
                    const endCpu = end[i].times;
                    const userDiff = endCpu.user - startCpu.user;
                    const systemDiff = endCpu.sys - startCpu.sys;
                    // Weight user time 2x more than system time
                    totalDiff += (userDiff * 2 + systemDiff) / (sampleMs * 3);
                }

                return {
                    cpuUsage: totalDiff / start.length,
                    cpuCount: start.length,
                };
            },
        },
    ],

    cases: [
        {
            name: 'quick sample',
            arguments: { sampleMs: 100 },
        },
        {
            name: 'medium sample',
            arguments: { sampleMs: 500 },
        },
        {
            name: 'long sample',
            arguments: { sampleMs: 1000 },
        },
    ],
});
