import React from 'react';
import type { PersistentLabResult } from '@/core/types';
import { formatDuration } from '@/utils';
import { Layout, ResultValue } from '../../components';
import { getLabResults, getLabs } from '../../lib';

export default function HistoryPage() {
    const [results, setResults] = React.useState<(PersistentLabResult & { labName: string })[]>([]);

    React.useEffect(() => {
        Promise.all([getLabs(), getLabResults()]).then(([labsData, resultsData]) => {
            // Add lab names to results
            const resultsWithLabNames = resultsData.map((result) => {
                const lab = labsData.find((l) => l.id === result.labId);

                return {
                    ...result,
                    labName: lab?.name || 'Unknown',
                };
            });

            setResults(resultsWithLabNames);
        });
    }, []);

    return (
        <Layout>
            <div className="px-4 sm:px-0">
                <h2 className="text-2xl font-bold mb-6">Lab Results History</h2>

                {results.length === 0 ? (
                    <p className="text-gray-500">
                        No lab results found. Run `solulab run` to generate some data.
                    </p>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lab Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Version
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Case
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Parameters
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Result
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.map((result) => (
                                    <tr key={result.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {result.labName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {result.versionName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {result.caseName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <ResultValue value={JSON.parse(result.params)} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {result.error ? (
                                                <span className="text-red-600">{result.error}</span>
                                            ) : (
                                                <ResultValue value={JSON.parse(result.result)} />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDuration(result.duration)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(result.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {result.error ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Failed
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Success
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}
