import { cn } from '@/app/utils/cn';

interface VersionSelectorProps {
    availableVersions: string[];
    selectedVersions: string[];
    onVersionToggle: (version: string) => void;
    maxSelections?: number;
}

export function VersionSelector({
    availableVersions,
    selectedVersions,
    onVersionToggle,
    maxSelections = 3,
}: VersionSelectorProps) {
    const isMaxSelected = selectedVersions.length >= maxSelections;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Select Versions to Compare ({selectedVersions.length}/{maxSelections})
            </label>
            
            <div className="flex flex-wrap gap-2">
                {availableVersions.map((version) => {
                    const isSelected = selectedVersions.includes(version);
                    const isDisabled = !isSelected && isMaxSelected;

                    return (
                        <button
                            key={version}
                            onClick={() => !isDisabled && onVersionToggle(version)}
                            disabled={isDisabled}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                isSelected
                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                                    : isDisabled
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                            )}
                        >
                            {version}
                        </button>
                    );
                })}
            </div>

            {isMaxSelected && (
                <p className="text-sm text-amber-600">
                    Maximum {maxSelections} versions can be selected. Deselect one to choose another.
                </p>
            )}
        </div>
    );
}