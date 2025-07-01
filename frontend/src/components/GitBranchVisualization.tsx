import React, { useEffect, useRef, useState } from 'react';
import { GitCommit, PullRequest, BranchPoint } from '../Types';
import { processGitHistoryTimeline } from '../utils/GitGraphUtils';
import { Loader2, Calendar } from 'lucide-react';

interface GitBranchVisualizationProps {
    commits: GitCommit[];
    pullRequests: PullRequest[];
    defaultBranch: string;
    loading: boolean;
    onHoverPR: (prNumber: number | null) => void;
    highlightedPR: number | null;
    dateRange: { start: Date; end: Date };
    onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

const GitBranchVisualization: React.FC<GitBranchVisualizationProps> = ({
    commits,
    pullRequests,
    defaultBranch,
    loading,
    onHoverPR,
    highlightedPR,
    dateRange,
    onDateRangeChange
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredPoint, setHoveredPoint] = useState<BranchPoint | null>(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 800 });

    // Process git history into timeline-based visual elements
    const { points, lines, timeLabels } = processGitHistoryTimeline(
        commits, 
        pullRequests, 
        defaultBranch, 
        dateRange
    );

    // Calculate SVG height based on date range
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const svgHeight = Math.max(600, daysDiff * 100 + 100); // 100px per day + padding

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                setDimensions({ width, height: svgHeight });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [svgHeight]);

    const handlePointHover = (point: BranchPoint | null) => {
        setHoveredPoint(point);
        if (point?.prNumber) {
            onHoverPR(point.prNumber);
        } else {
            onHoverPR(null);
        }
    };

    // Date range presets
    const setDateRangePreset = (preset: 'week' | 'month' | '3months') => {
        const end = new Date();
        const start = new Date();
        
        switch (preset) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setMonth(end.getMonth() - 1);
                break;
            case '3months':
                start.setMonth(end.getMonth() - 3);
                break;
        }
        
        onDateRangeChange({ start, end });
    };

    if (loading) {
        return (
            <div className="h-full bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 flex flex-col">
            {/* Header with date range selector */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Git Timeline
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setDateRangePreset('week')}
                        className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Denna vecka
                    </button>
                    <button
                        onClick={() => setDateRangePreset('month')}
                        className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Senaste månaden
                    </button>
                    <button
                        onClick={() => setDateRangePreset('3months')}
                        className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                        3 månader
                    </button>
                </div>
            </div>

            {/* Scrollable SVG container */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden relative git-branch-viz"
                style={{ maxHeight: 'calc(100% - 100px)' }}
            >
                <svg
                    ref={svgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    className="w-full"
                >
                    <defs>
                        {/* Gradient för dev branch */}
                        <linearGradient id="devBranchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                        </linearGradient>

                        {/* Gradient för main branch */}
                        <linearGradient id="mainBranchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(236, 72, 153)" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="0.3" />
                        </linearGradient>

                        {/* Feature branch gradients */}
                        <linearGradient id="featureBranchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>

                    {/* Time labels */}
                    {timeLabels.map((label, idx) => (
                        <g key={idx}>
                            <line
                                x1={0}
                                y1={label.y}
                                x2={dimensions.width}
                                y2={label.y}
                                stroke="currentColor"
                                strokeOpacity={0.1}
                                strokeDasharray="2,4"
                                className="text-gray-400 dark:text-zinc-600"
                            />
                            <text
                                x={10}
                                y={label.y - 5}
                                fontSize="10"
                                fill="currentColor"
                                className="text-gray-500 dark:text-zinc-500"
                            >
                                {label.text}
                            </text>
                        </g>
                    ))}

                    {/* Branch labels at top */}
                    <text x={50} y={20} fontSize="12" fontWeight="bold" fill="rgb(236, 72, 153)">main</text>
                    <text x={150} y={20} fontSize="12" fontWeight="bold" fill="rgb(139, 92, 246)">{defaultBranch}</text>

                    {/* Render lines */}
                    {lines.map((line, idx) => (
                        <g key={idx}>
                            {line.type === 'straight' ? (
                                <line
                                    x1={line.from.x}
                                    y1={line.from.y}
                                    x2={line.to.x}
                                    y2={line.to.y}
                                    stroke={
                                        line.from.branchName === 'main' ? "url(#mainBranchGradient)" :
                                        line.from.branchName === defaultBranch ? "url(#devBranchGradient)" :
                                        "url(#featureBranchGradient)"
                                    }
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            ) : (
                                <path
                                    d={`M ${line.from.x} ${line.from.y} C ${line.from.x} ${line.from.y + 20}, ${line.to.x} ${line.to.y - 20}, ${line.to.x} ${line.to.y}`}
                                    fill="none"
                                    stroke="url(#featureBranchGradient)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            )}
                        </g>
                    ))}

                    {/* Render points */}
                    {points.map((point) => (
                        <g key={point.id}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={point.isPR ? 6 : 4}
                                fill={
                                    point.branchName === 'main' ? "rgb(236, 72, 153)" :
                                    point.branchName === defaultBranch ? "rgb(139, 92, 246)" :
                                    point.isPR ? "rgb(34, 197, 94)" :
                                    "rgb(59, 130, 246)"
                                }
                                stroke={
                                    point.prNumber === highlightedPR
                                        ? "rgb(251, 191, 36)"
                                        : "white"
                                }
                                strokeWidth={point.prNumber === highlightedPR ? 3 : 2}
                                className={`cursor-pointer transition-all hover:r-8 ${
                                    point.prNumber === highlightedPR ? 'highlighted' : ''
                                }`}
                                onMouseEnter={() => handlePointHover(point)}
                                onMouseLeave={() => handlePointHover(null)}
                            />
                            {point.isPR && point.prNumber && (
                                <text
                                    x={point.x + 10}
                                    y={point.y + 3}
                                    fontSize="10"
                                    fill="rgb(156, 163, 175)"
                                    className="select-none pointer-events-none"
                                >
                                    #{point.prNumber}
                                </text>
                            )}
                        </g>
                    ))}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div
                        className="absolute z-10 bg-gray-900 dark:bg-zinc-800 text-white p-3 rounded-lg shadow-xl max-w-xs pointer-events-none"
                        style={{
                            left: Math.min(hoveredPoint.x + 20, dimensions.width - 200),
                            top: hoveredPoint.y - 10,
                        }}
                    >
                        <div className="text-sm">
                            {hoveredPoint.branchName && (
                                <div className="font-semibold text-blue-400 mb-1">{hoveredPoint.branchName}</div>
                            )}
                            <div className="text-xs text-gray-300">
                                {hoveredPoint.commit.message.split('\n')[0]}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {hoveredPoint.commit.author} • {new Date(hoveredPoint.commit.date).toLocaleDateString('sv-SE')}
                            </div>
                            {hoveredPoint.isPR && hoveredPoint.prNumber && (
                                <div className="text-xs text-green-400 mt-1">
                                    Pull Request #{hoveredPoint.prNumber}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GitBranchVisualization;
