import React from "react";
import { GitBranch, ExternalLink, Copy, Loader2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { AsanaTask, PullRequest } from "../Types";
import { DropArea, DropAreaItemsTeaser } from "./DragAndDrop";

interface PullRequestsListProps {
    loading: boolean;
    pullRequests: PullRequest[];
    selectedPRs: Set<number>;
    assignedTasks: { [key: number]: AsanaTask[]; }
    loadingCommits: Record<number, boolean>;
    showAllPRs: boolean;
    allPRsCount: number;
    onPRSelect: (pr: PullRequest) => void;
    onToggleShowAll: () => void;
    onCopyLink: (url: string) => void;
    setAssignedTasks?: (tasks: { [key: number]: AsanaTask[]; }) => void;
    removeAssignedTask?: (prNumber: number, taskId: string) => void;
}

const PullRequestsList: React.FC<PullRequestsListProps> = ({
    loading,
    pullRequests,
    selectedPRs,
    assignedTasks,
    loadingCommits,
    showAllPRs,
    allPRsCount,
    onPRSelect,
    onToggleShowAll,
    onCopyLink,
    setAssignedTasks,
    removeAssignedTask,
}) => {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-brand-500" />
                Pull Requests
            </h3>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
            ) : pullRequests.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                    Inga pull requests hittades
                </p>
            ) : (
                <>
                    <div className="relative">
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 pb-4">
                            {pullRequests.map(pr => (
                                <DropArea
                                    isActive={selectedPRs.has(pr.id)}
                                    items={assignedTasks[pr.number] || []}
                                    onChange={(tasks) => {
                                        if (setAssignedTasks) {
                                            setAssignedTasks({
                                                ...assignedTasks,
                                                [pr.number]: tasks,
                                            });
                                        }
                                    }}
                                >
                                    <div
                                        key={pr.id}
                                        className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedPRs.has(pr.id)
                                            ? "bg-brand-950/30 border-brand-800"
                                            : "bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800"
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                onClick={() => onPRSelect(pr)}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${selectedPRs.has(pr.id)
                                                    ? "bg-brand-600 border-brand-600"
                                                    : "border-zinc-600"
                                                }`}>
                                                {selectedPRs.has(pr.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="text-sm text-zinc-500">#{pr.number}</span>
                                                    <h4 className="font-medium text-gray-200">{pr.title}</h4>
                                                    {loadingCommits[pr.number] && (
                                                        <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-zinc-500">
                                                    av {pr.user.login} • {new Date(pr.created_at).toLocaleDateString("sv-SE")}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <DropAreaItemsTeaser items={assignedTasks[pr.number] || []} removeItem={(asanatask) => {
                                                    if (removeAssignedTask) {
                                                        removeAssignedTask(pr.number, asanatask.gid);
                                                    }
                                                }} />

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(pr.html_url, "_blank");
                                                    }}
                                                    className="p-1.5 hover:bg-zinc-700 rounded transition-colors ml-2"
                                                    title="Öppna PR"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCopyLink(pr.html_url);
                                                    }}
                                                    className="p-1.5 hover:bg-zinc-700 rounded transition-colors"
                                                    title="Kopiera länk"
                                                >
                                                    <Copy className="w-4 h-4 text-zinc-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </DropArea>
                            ))}
                        </div>
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                    </div>

                    {allPRsCount > 8 && (
                        <button
                            onClick={onToggleShowAll}
                            className="mt-4 text-brand-400 hover:text-brand-300 text-sm font-medium flex items-center gap-1"
                        >
                            {showAllPRs ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Visa färre
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Visa alla ({allPRsCount - 8} till)
                                </>
                            )}
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default PullRequestsList;
