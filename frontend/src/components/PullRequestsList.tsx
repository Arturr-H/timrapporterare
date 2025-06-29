import React from "react";
import { GitBranch, ExternalLink, Copy, Loader2, ChevronDown, ChevronUp, Check, GitPullRequestArrow, X, Search } from "lucide-react";
import { AsanaTask, PullRequest } from "../Types";
import { DropArea, DropAreaItemsTeaser } from "./DragAndDrop";
import { SearchBar } from "./SearchBar";
import { WordTag } from "./WordTag";

interface PullRequestsListProps {
    loading: boolean;
    pullRequests: PullRequest[];
    selectedPRs: Set<number>;
    assignedTasks: { [key: number]: AsanaTask[]; }
    loadingCommits: Record<number, boolean>;
    allPRsCount: number;
    prSearchQuery: string;
    onPRSelect: (pr: PullRequest) => void;
    onCopyLink: (url: string) => void;
    setAssignedTasks?: (tasks: { [key: number]: AsanaTask[]; }) => void;
    removeAssignedTask?: (prNumber: number, taskId: string) => void;
    setPrSearchQuery: (query: string) => void;
}

const PullRequestsList: React.FC<PullRequestsListProps> = ({
    loading,
    pullRequests,
    selectedPRs,
    assignedTasks,
    loadingCommits,
    allPRsCount,
    prSearchQuery,
    onPRSelect,
    onCopyLink,
    setAssignedTasks,
    removeAssignedTask,
    setPrSearchQuery,
}) => {
    const getAutoMergeMethodTag = (method?: string) => {
        if (!method) return null;

        const methodLower = method.toLowerCase();
        let tagColor = "bg-zinc-800 text-zinc-400";

        switch (methodLower) {
            case "merge":
                tagColor = "bg-green-900 text-green-400";
                break;
            case "squash":
                tagColor = "bg-yellow-900 text-yellow-400";
                break;
            case "rebase":
                tagColor = "bg-blue-900 text-blue-400";
                break;
            default:
                tagColor = "bg-zinc-800 text-zinc-400";
        }

        return <WordTag word={`auto:${method}`} className={tagColor} />;
    }

    // "1h ago", "2 days ago", "3 weeks ago", etc.
    const getTimeDescription = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        const diffInMinutes = Math.round(diffInSeconds / 60);
        const diffInHours = Math.round(diffInMinutes / 60);
        const diffInDays = Math.round(diffInHours / 24);
        const diffInWeeks = Math.round(diffInDays / 7);

        if (diffInSeconds < 60) return "precis";
        if (diffInMinutes < 60) return `${diffInMinutes} min sedan`;
        if (diffInHours < 24) return `${diffInHours} tim sedan`;
        if (diffInDays < 1) return "igår";
        if (diffInDays < 7) return `${diffInDays} dagar sedan`;
        if (diffInWeeks < 4) return `${diffInWeeks} veckor sedan`;

        return date.toLocaleDateString("sv-SE", { month: 'short', day: 'numeric' });
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <GitPullRequestArrow className="w-5 h-5 text-brand-500" />
                    Pull Requests

                    <p className="text-sm text-zinc-500">
                        (visar {allPRsCount} {allPRsCount === 1 ? "PR" : "PRs"})
                    </p>
                </h3>

                <SearchBar
                    searchQuery={prSearchQuery}
                    setSearchQuery={setPrSearchQuery}
                    className="relative flex-1 max-w-xs"
                />
            </div>

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
                                                }`}
                                                tabIndex={0}
                                            >
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
                                                <div className="text-sm text-zinc-500 justify-start items-end flex gap-2">
                                                    {new Date(pr.created_at).toLocaleDateString("sv-SE")}
                                                    <a href={pr.user.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {pr.user.login}
                                                    </a>
                                                    <img
                                                        src={pr.user.avatar_url}
                                                        alt={pr.user.login}
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                    <div className="items-center inline-block mt-1 flex-wrap max-w-[20rem] overflow-x-scroll">
                                                        <div className="inline-flex items-center gap-1">
                                                            {getAutoMergeMethodTag(pr.auto_merge?.merge_method)}
                                                            {pr.draft && <WordTag word={"Draft"} className="bg-yellow-900 text-yellow-400" />}
                                                            {pr.state === "closed" && <WordTag word={"Stängd"} className="bg-zinc-700 text-zinc-300" />}
                                                            {pr.state === "merged" && <WordTag word={"Merge:ad"} className="bg-green-900 text-green-400" />}
                                                            {pr.state === "open" && <WordTag word={"Öppen"} className="bg-blue-900 text-blue-400" />}
                                                            {pr.merged_at && <WordTag word={`Merge:ad ${getTimeDescription(pr.merged_at)}`} className="bg-green-900 text-green-400" />}
                                                        </div>
                                                    </div>
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
                                                    tabIndex={-1}
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
                                                    tabIndex={-1}
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
                </>
            )}
        </div>
    );
};

export default PullRequestsList;
