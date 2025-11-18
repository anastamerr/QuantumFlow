import { memo, useMemo, useState, useCallback } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  RepeatIcon, // Used as a spinning loader/spinner (alternative to Loader2)
  WarningIcon, // Used for alerts (alternative to AlertTriangle)
} from '@chakra-ui/icons';
import {
  formatQuantumState,
  FORMAT_PRESETS,
  estimateFormattingCost,
  type FormattedState,
} from '../../../utils/formatState';

interface Snapshot {
  id: string;
  name: string;
  preview: string;
  timestamp: string;
  metadata?: {
    qubits?: number;
    gates?: number;
  };
}

interface SnapshotCardProps {
  snapshot: Snapshot;
  onDelete?: (id: string) => void;
  onLoadFull?: (id: string) => Promise<string>;
}

export const SnapshotCard = memo(function SnapshotCard({
  snapshot,
  onDelete,
  onLoadFull,
}: SnapshotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullState, setShowFullState] = useState(false);
  const [fullStateData, setFullStateData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formatMode, setFormatMode] = useState<'preview' | 'detailed' | 'compact' | 'scientific'>('preview');

  const previewFormatted = useMemo(
    () => formatQuantumState(snapshot.preview, FORMAT_PRESETS.preview),
    [snapshot.preview]
  );

  const fullFormatted = useMemo(() => {
    if (!fullStateData) return null;
    return formatQuantumState(fullStateData, FORMAT_PRESETS[formatMode]);
  }, [fullStateData, formatMode]);

  const costEstimate = useMemo(() => {
    if (!fullStateData) return null;
    return estimateFormattingCost(fullStateData);
  }, [fullStateData]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleShowFullState = useCallback(async () => {
    if (showFullState) {
      setShowFullState(false);
      return;
    }

    if (!fullStateData && onLoadFull) {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 0));
        const data = await onLoadFull(snapshot.id);
        setFullStateData(data);
        setShowFullState(true);
      } catch (error) {
        console.error('Failed to load full state:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowFullState(true);
    }
  }, [showFullState, fullStateData, onLoadFull, snapshot.id]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(snapshot.id);
    }
  }, [onDelete, snapshot.id]);

  const handleFormatChange = useCallback((mode: typeof formatMode) => {
    setFormatMode(mode);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleExpand}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {/* 🔄 Replaced ChevronDown / ChevronRight */}
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <h3 className="text-lg font-semibold text-gray-900">{snapshot.name}</h3>
          </div>

          <div className="mt-2 ml-7">
            <div className="quantum-state-preview">
              <code className="text-sm text-gray-700">{previewFormatted.preview}</code>
            </div>

            {previewFormatted.isTruncated && (
              <p className="text-xs text-gray-500 mt-1">
                {previewFormatted.visibleTermCount}/{previewFormatted.termCount} terms shown
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{new Date(snapshot.timestamp).toLocaleString()}</span>
              {snapshot.metadata?.qubits && (
                <span>{snapshot.metadata.qubits} qubits</span>
              )}
              {!previewFormatted.isNormalized && (
                <span className="text-orange-600 flex items-center gap-1">
                  {/* 🔄 Replaced AlertTriangle with WarningIcon */}
                  <WarningIcon className="w-3 h-3" />
                  Not normalized
                </span>
              )}
              {previewFormatted.qubits > 12 && (
                <span className="text-amber-600 flex items-center gap-1">
                  {/* 🔄 Replaced AlertTriangle with WarningIcon */}
                  <WarningIcon className="w-3 h-3" />
                  High-qubit state
                </span>
              )}
            </div>
          </div>
        </div>

        {onDelete && (
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-4 ml-7 space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShowFullState}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  {/* 🔄 Replaced Loader2 with RepeatIcon and added a spinning class */}
                  <RepeatIcon className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : showFullState ? (
                'Hide Full State'
              ) : (
                'Show Full State'
              )}
            </button>

            {showFullState && fullFormatted && (
              <div className="flex gap-1">
                {(['preview', 'detailed', 'compact', 'scientific'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleFormatChange(mode)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      formatMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showFullState && fullFormatted && (
            <div className="quantum-state-display">
              <div className="text-xs text-gray-400 mb-2">
                {fullFormatted.visibleTermCount} terms shown
                {fullFormatted.hiddenTermCount > 0 &&
                  `, ${fullFormatted.hiddenTermCount} hidden`}
                {costEstimate && costEstimate.cost === 'extreme' && (
                  <span className="ml-2 text-orange-500">
                    (sampled - showing top 100 terms)
                  </span>
                )}
              </div>
              <div className="quantum-state-content">
                {fullFormatted.lines.map((line, idx) => (
                  <div key={idx} className="quantum-state-line">
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 space-y-1">
                <div>Qubits: {fullFormatted.qubits}</div>
                <div>Max Probability: {(fullFormatted.maxProbability * 100).toFixed(2)}%</div>
                <div>
                  Normalized: {fullFormatted.isNormalized ? 'Yes' : 'No'}
                </div>
                <div>Size: {(fullFormatted.estimatedSize / 1024).toFixed(1)} KB</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
export default SnapshotCard;