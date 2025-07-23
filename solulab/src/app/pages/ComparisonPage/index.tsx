import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLabs, getLabResults } from '@/app/lib/api';
import { Layout, SelectField, ComparisonMatrix } from '@/app/components';
import type { PersistentLab, PersistentLabResult } from '@/core/types';

export function ComparisonPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [labs, setLabs] = React.useState<PersistentLab[]>([]);
    const [selectedLab, setSelectedLab] = React.useState<PersistentLab | null>(null);
    const [results, setResults] = React.useState<PersistentLabResult[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Get query params
    const labName = searchParams.get('lab');
    const caseName = searchParams.get('case');
    const propertyName = searchParams.get('property');

    // Load labs on mount
    React.useEffect(() => {
        getLabs().then((labsData) => {
            setLabs(labsData);
            setLoading(false);
        });
    }, []);

    // Update selected lab when lab param changes
    React.useEffect(() => {
        if (labName && labs.length > 0) {
            const lab = labs.find((l) => l.name === labName);
            setSelectedLab(lab || null);

            // Load results for this lab
            if (lab) {
                getLabResults(lab.id).then(setResults);
            }
        } else {
            setSelectedLab(null);
            setResults([]);
        }
    }, [labName, labs]);

    // Handler for lab selection
    const handleLabChange = (newLabName: string) => {
        if (newLabName) {
            setSearchParams({ lab: newLabName });
        } else {
            setSearchParams({});
        }
    };

    // Handler for case selection
    const handleCaseChange = (newCaseName: string) => {
        if (labName && newCaseName) {
            setSearchParams({ lab: labName, case: newCaseName });
        } else if (labName) {
            setSearchParams({ lab: labName });
        }
    };

    // Handler for property selection
    const handlePropertyChange = (newPropertyName: string) => {
        if (labName && caseName && newPropertyName) {
            setSearchParams({ lab: labName, case: caseName, property: newPropertyName });
        } else if (labName && caseName) {
            setSearchParams({ lab: labName, case: caseName });
        }
    };

    // Get unique cases from results
    const availableCases = React.useMemo(() => {
        if (!selectedLab || results.length === 0) {
            return [];
        }

        const cases = new Set(results.map((r) => r.caseName));

        return Array.from(cases).sort();
    }, [selectedLab, results]);

    // Get results for selected case
    const caseResults = React.useMemo(() => {
        if (!caseName) {
            return [];
        }

        return results.filter((r) => r.caseName === caseName);
    }, [results, caseName]);

    // Get available properties from results
    const availableProperties = React.useMemo(() => {
        if (caseResults.length === 0) {
            return [];
        }
        try {
            // Parse the first result to get object keys
            const firstResult = JSON.parse(caseResults[0].result);

            if (
                typeof firstResult === 'object' &&
                firstResult !== null &&
                !Array.isArray(firstResult)
            ) {
                return Object.keys(firstResult).sort();
            }
        } catch {
            // Not an object result
        }

        return [];
    }, [caseResults]);

    if (loading) {
        return (
            <Layout>
                <div className="p-8">Loading...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8">
                <h1 className="text-2xl font-semibold mb-8">Lab Comparison</h1>

                <div className="space-y-6">
                    {/* Lab Selection */}
                    <SelectField
                        label="Select Lab"
                        options={labs.map((lab) => ({ value: lab.name, label: lab.name }))}
                        value={labName || ''}
                        onChange={(e) => handleLabChange(e.target.value)}
                        placeholder="Choose a lab..."
                    />

                    {/* Case Selection */}
                    {selectedLab && availableCases.length > 0 && (
                        <SelectField
                            label="Select Case"
                            options={availableCases.map((name) => ({ value: name, label: name }))}
                            value={caseName || ''}
                            onChange={(e) => handleCaseChange(e.target.value)}
                            placeholder="Choose a case..."
                        />
                    )}

                    {/* Property Selection */}
                    {caseName && availableProperties.length > 0 && (
                        <SelectField
                            label="Select Property"
                            options={availableProperties.map((prop) => ({
                                value: prop,
                                label: prop,
                            }))}
                            value={propertyName || ''}
                            onChange={(e) => handlePropertyChange(e.target.value)}
                            placeholder="Choose a property..."
                        />
                    )}
                </div>

                {/* Comparison Results */}
                {caseName && caseResults.length > 0 && (
                    <div className="mt-8">
                        <ComparisonMatrix
                            results={caseResults}
                            propertyName={propertyName || undefined}
                            labName={selectedLab?.name}
                            caseName={caseName}
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
}
