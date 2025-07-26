import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLabs, getLabResults } from '@/app/lib/api';
import {
    Layout,
    SelectField,
    MultiSelectField,
    TableComparisonMatrix,
} from '@/app/components';
import type { PersistentLab, PersistentLabResult } from '@/core/types';

export function ComparisonPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get query params first
    const labName = searchParams.get('lab');
    const casesParam = searchParams.get('cases');
    const versionsParam = searchParams.get('versions');
    
    const [labs, setLabs] = React.useState<PersistentLab[]>([]);
    const [selectedLab, setSelectedLab] = React.useState<PersistentLab | null>(null);
    const [results, setResults] = React.useState<PersistentLabResult[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    // Initialize from URL params to prevent race conditions
    const initialVersions = versionsParam ? versionsParam.split(',') : [];
    const initialCases = casesParam ? casesParam.split(',') : [];
    
    const [selectedVersions, setSelectedVersions] = React.useState<string[]>(initialVersions);
    const [selectedCases, setSelectedCases] = React.useState<string[]>(initialCases);

    // Load labs on mount
    React.useEffect(() => {
        getLabs().then((labsData) => {
            setLabs(labsData);
            setLoading(false);
            
            // Auto-select first lab if none selected
            if (!labName && labsData.length > 0) {
                setSearchParams({ lab: labsData[0].name });
            }
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
    const handleCaseChange = (newCases: string[]) => {
        setSelectedCases(newCases);
        
        if (labName) {
            const params: Record<string, string> = { lab: labName };
            if (selectedVersions.length > 0) {
                params.versions = selectedVersions.join(',');
            }
            if (newCases.length > 0) {
                params.cases = newCases.join(',');
            }
            setSearchParams(params);
        }
    };


    // Get unique cases from results filtered by selected versions
    const availableCases = React.useMemo(() => {
        if (!selectedLab || results.length === 0 || selectedVersions.length === 0) {
            return [];
        }

        // Filter results by selected versions
        const filteredResults = results.filter(r => selectedVersions.includes(r.versionName));
        const cases = new Set(filteredResults.map((r) => r.caseName));

        const sortedCases = Array.from(cases).sort();
        
        // Auto-select first case only if no cases were provided in URL and none are selected
        if (selectedCases.length === 0 && sortedCases.length > 0 && labName && !casesParam) {
            const params: Record<string, string> = { lab: labName };
            params.cases = sortedCases[0];
            if (selectedVersions.length > 0) {
                params.versions = selectedVersions.join(',');
            }
            setSearchParams(params);
        }
        
        return sortedCases;
    }, [selectedLab, results, selectedVersions, labName, casesParam]);

    // Get results for selected cases
    const selectedCaseResults = React.useMemo(() => {
        if (selectedCases.length === 0) {
            return [];
        }

        return results.filter((r) => selectedCases.includes(r.caseName));
    }, [results, selectedCases]);


    // Get all available versions from results
    const availableVersions = React.useMemo(() => {
        if (!selectedLab || results.length === 0) {
            return [];
        }

        const versions = new Set(results.map((r) => r.versionName));
        return Array.from(versions).sort();
    }, [selectedLab, results]);

    // Initialize selected versions from URL or defaults
    React.useEffect(() => {
        if (versionsParam && availableVersions.length > 0) {
            // Parse versions from URL
            const urlVersions = versionsParam.split(',').filter(v => availableVersions.includes(v));
            if (urlVersions.length > 0) {
                setSelectedVersions(urlVersions.slice(0, 3));
            } else {
                // URL versions not valid, use defaults
                setSelectedVersions(availableVersions.slice(0, 3));
            }
        } else if (availableVersions.length > 0) {
            // No URL param, select first 3 versions by default
            setSelectedVersions(availableVersions.slice(0, 3));
        } else {
            setSelectedVersions([]);
        }
    }, [availableVersions, versionsParam]);

    // Initialize selected cases from URL
    React.useEffect(() => {
        if (casesParam && availableCases.length > 0) {
            const urlCases = casesParam.split(',').filter(c => availableCases.includes(c));
            if (urlCases.length > 0) {
                setSelectedCases(urlCases);
            } else {
                setSelectedCases([]);
            }
        } else if (availableCases.length > 0 && selectedCases.length === 0) {
            // No URL param and no selection, select first case by default
            setSelectedCases([availableCases[0]]);
        }
    }, [availableCases, casesParam]);

    // Handler for version selection
    const handleVersionChange = (newVersions: string[]) => {
        setSelectedVersions(newVersions);
        
        // Update URL with new versions
        if (labName) {
            const params: Record<string, string> = { lab: labName };
            if (newVersions.length > 0) {
                params.versions = newVersions.join(',');
            }
            // Reset case and property when versions change
            setSearchParams(params);
        }
    };

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
                {/* All selectors in one horizontal row - full width */}
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    {/* Lab Selection */}
                    <div className="flex-1">
                        <SelectField
                            label="Lab"
                            options={labs.map((lab) => ({ value: lab.name, label: lab.name }))}
                            value={labName || ''}
                            onChange={(value) => handleLabChange(value)}
                            placeholder="Choose a lab..."
                            className="w-full"
                        />
                    </div>

                    {/* Version Selection */}
                    {selectedLab && availableVersions.length > 0 && (
                        <div className="flex-1">
                            <MultiSelectField
                                label="Versions"
                                options={availableVersions}
                                selectedValues={selectedVersions}
                                onChange={handleVersionChange}
                                placeholder="Select versions..."
                                maxSelections={3}
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Case Selection */}
                    {selectedLab && selectedVersions.length > 0 && availableCases.length > 0 && (
                        <div className="flex-1">
                            <MultiSelectField
                                label="Cases"
                                options={availableCases}
                                selectedValues={selectedCases}
                                onChange={handleCaseChange}
                                placeholder="Select cases..."
                                maxSelections={10}
                                className="w-full"
                            />
                        </div>
                    )}

                </div>

                {/* Comparison Results */}
                {selectedLab && selectedVersions.length > 0 && selectedCaseResults.length > 0 && (
                    <div className="mt-8">
                        <TableComparisonMatrix
                            results={selectedCaseResults}
                            selectedVersions={selectedVersions}
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
}
