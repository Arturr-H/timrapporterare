import React from "react";
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, GitCommit, GitCommitVertical } from "lucide-react";
import { PRCommitsData } from "../Types";

interface PRCommitsViewProps {
    currentPRIndex: number;
    selectedPRNumbers: number[];
    currentCommitData: PRCommitsData;
    selectedCommits: string[]; // Array of commit SHAs
    onPrev: () => void;
    onNext: () => void;
    onCopyLink: () => void;
    onCommitSelectionChange: (commitSha: string, isSelected: boolean) => void;
}

const PRCommitsView: React.FC<PRCommitsViewProps> = ({
    currentPRIndex,
    selectedPRNumbers,
    currentCommitData,
    selectedCommits,
    onPrev,
    onNext,
    onCopyLink,
    onCommitSelectionChange,
}) => {
    const handleCommitCheck = (commitSha: string, checked: boolean) => {
        onCommitSelectionChange(commitSha, checked);
    };

    // Keybinds onNext and onPrev
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                onNext();
            } else if (event.key === "ArrowLeft") {
                onPrev();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onNext, onPrev]);

    return (
        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1 flex items-center gap-2">
                    <GitCommitVertical className="w-5 h-5 text-brand-500" />
                    <h3 className="text-lg font-medium mb-0">
                        Commits in #{currentCommitData.pull_url.split("/").pop()}
                    </h3>
                </div>

                <div className="flex-1 flex items-center justify-center gap-4">
                    <button
                        onClick={onPrev}
                        disabled={currentPRIndex === 0}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-zinc-800"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-96 overflow-hidden text-center">
                        <h3 className="text-lg font-medium text-zinc-100 truncate">
                            {currentCommitData.pull_title.trim()}
                        </h3>
                    </div>
                    <button
                        onClick={onNext}
                        disabled={currentPRIndex === selectedPRNumbers.length - 1}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-zinc-800"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 flex justify-end">
                    <button
                        onClick={onCopyLink}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Kopiera PR länk"
                    >
                        <Copy className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
            </div>


            <div className="relative">
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 pb-2 h-80">
                    {currentCommitData.commits.map((commit, idx) => {
                        const isSelected = selectedCommits.includes(commit.sha);

                        return (
                            <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => handleCommitCheck(commit.sha, !isSelected)}>
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center pt-0.5">
                                        <div
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${isSelected
                                                ? "bg-brand-600 border-brand-600"
                                                : "border-zinc-600"
                                                }`}
                                            onClick={() => handleCommitCheck(commit.sha, !isSelected)}
                                            title={isSelected ? "Avmarkera commit" : "Markera commit"}
                                        >
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                    <div className="flex items-start justify-between gap-2 flex-1">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-300">{commit.message}</p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {commit.sha.substring(0, 7)} • {commit.author} • {new Date(commit.date).toLocaleDateString("sv-SE")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => window.open(commit.url, "_blank")}
                                            className="p-2 hover:bg-zinc-700 rounded transition-colors"
                                            title="Öppna commit"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-zinc-900 to-transparent"></div>
            </div>
        </div>
    );
};

export default PRCommitsView;
