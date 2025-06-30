import React from "react";
import { Check, ChevronLeft, ChevronRight, Construction, Copy, ExternalLink, GitCommit, GitCommitVertical, Scroll } from "lucide-react";
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
    setSelectedCommits: (commits: string[]) => void;
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
    setSelectedCommits,
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
        <div className="mb-8 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                <div className="flex-1 flex items-center gap-2 order-2 md:order-1">
                    <Construction className="w-5 h-5 text-brand-500" />
                    <h3 className="text-lg font-medium mb-0 text-gray-900 dark:text-white">
                        Commits in #{currentCommitData.pull_url.split("/").pop()}
                    </h3>
                </div>

                <div className="flex items-center justify-center gap-4 order-1 md:order-2 w-full md:w-auto">
                    <button
                        onClick={onPrev}
                        disabled={currentPRIndex === 0}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-50 dark:bg-zinc-800"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="flex-1 md:w-96 overflow-hidden text-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 truncate">
                            {currentCommitData.pull_title.trim()}
                        </h3>
                    </div>
                    <button
                        onClick={onNext}
                        disabled={currentPRIndex === selectedPRNumbers.length - 1}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-gray-50 dark:bg-zinc-800"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                <div className="flex justify-end gap-2 order-3">
                    <div className="flex items-center">
                        <button
                            title="Markera / Avmarkera alla commits"
                            className={`cursor-pointer w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${currentCommitData.commits.every(commit => selectedCommits.includes(commit.sha))
                                ? "bg-brand-600 border-brand-600"
                                : "border-gray-400 dark:border-zinc-600"
                                }`}
                            onClick={() => {
                                let isSelected = currentCommitData.commits.every(commit => selectedCommits.includes(commit.sha));

                                // Remove only commits for this PR
                                if (isSelected) {
                                    setSelectedCommits(selectedCommits.filter(sha => !currentCommitData.commits.some(commit => commit.sha === sha)));
                                } else {
                                    // Add all commits for this PR
                                    const newSelectedCommits = currentCommitData.commits.map(commit => commit.sha);
                                    let updatedSelectedCommits = [...selectedCommits];
                                    newSelectedCommits.forEach(sha => {
                                        if (!updatedSelectedCommits.includes(sha)) {
                                            updatedSelectedCommits.push(sha);
                                        }
                                    });
                                    setSelectedCommits(updatedSelectedCommits);
                                }
                            }}
                            tabIndex={0}
                        >
                            {currentCommitData.commits.every(commit => selectedCommits.includes(commit.sha)) && <Check className="w-3 h-3 text-white" />}
                        </button>
                    </div>

                    <button
                        onClick={onCopyLink}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Kopiera PR länk"
                    >
                        <Copy className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                    </button>

                </div>
            </div>

            <div className="relative">
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 pb-2 h-80">
                    {currentCommitData.commits.map((commit, idx) => {
                        const isSelected = selectedCommits.includes(commit.sha);

                        return (
                            <div
                                key={idx}
                                className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center pt-0.5">
                                        <button
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${isSelected
                                                ? "bg-brand-600 border-brand-600"
                                                : "border-gray-400 dark:border-zinc-600"
                                                }`}
                                            onClick={() => handleCommitCheck(commit.sha, !isSelected)}
                                            tabIndex={0}
                                            title={isSelected ? "Avmarkera commit" : "Markera commit"}
                                        >
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    </div>
                                    <div className="flex items-start justify-between gap-2 flex-1">
                                        <div
                                            className="flex-1 text-left"
                                            onClick={() => handleCommitCheck(commit.sha, !isSelected)}
                                        >
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{commit.message}</p>
                                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                                                {commit.sha.substring(0, 7)} • {commit.author} • {new Date(commit.date).toLocaleDateString("sv-SE")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => window.open(commit.url, "_blank")}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors"
                                            title="Öppna commit"
                                            tabIndex={-1} // Prevent focus
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent"></div>
            </div>
        </div>
    );
};

export default PRCommitsView;
