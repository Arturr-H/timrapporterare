import React, { useState } from "react";
import { GitBranch, Star, Plus, X, ChevronDown, Github } from "lucide-react";
import { Repository } from "../Types";
import { WordTag } from "./WordTag";

interface RepositorySelectorProps {
    selectedRepo: string;
    repos: Repository[];
    favorites: string[];
    onSelectRepo: (repo: string) => void;
    onToggleFavorite: (repoId: number) => void;
    onRemoveRepo: (fullName: string) => void;
    onAddRepo: () => void;
    onOpenTokenModal: () => void;
}

const RepositorySelector: React.FC<RepositorySelectorProps> = ({
    selectedRepo,
    repos,
    favorites,
    onSelectRepo,
    onToggleFavorite,
    onRemoveRepo,
    onAddRepo,
    onOpenTokenModal,
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-gray-600 dark:text-zinc-400">Välj repository</label>
            </div>
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg flex items-center justify-between hover:border-gray-400 dark:hover:border-zinc-700 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-gray-500 dark:text-zinc-500" />
                        <span className="text-gray-900 dark:text-white">
                            {selectedRepo ? repos.find(r => r.full_name === selectedRepo)?.name : "Välj ett repository..."}
                        </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-zinc-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg shadow-xl">
                        <div className="max-h-64 overflow-y-auto">
                            {repos.map(repo => (
                                <div
                                    key={repo.id}
                                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group rounded-lg"
                                >
                                    <button
                                        onClick={() => {
                                            onSelectRepo(repo.full_name);
                                            setDropdownOpen(false);
                                        }}
                                        className="flex-1 flex items-center gap-2 text-left"
                                    >
                                        <GitBranch className="w-4 h-4 text-gray-500 dark:text-zinc-500" />
                                        <span className="text-gray-900 dark:text-white">{repo.name}</span>
                                        {repo.organization && (
                                            <WordTag word={repo.organization} className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400" />
                                        )}
                                        {repo.private && (
                                            <WordTag word="Private" className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400" />
                                        )}
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(repo.id);
                                            }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                                        >
                                            <Star
                                                className={`w-4 h-4 ${favorites.includes(String(repo.id)) ? "fill-yellow-500 text-yellow-500" : "text-gray-400 dark:text-zinc-500"}`}
                                            />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveRepo(repo.full_name);
                                            }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded opacity-[0.4] group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setDropdownOpen(false);
                                onAddRepo();
                            }}
                            className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-t border-gray-200 dark:border-zinc-800 rounded-lg"
                        >
                            <Plus className="w-4 h-4 text-brand-600 dark:text-brand-500" />
                            <span className="text-brand-600 dark:text-brand-400">Lägg till repository</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepositorySelector;
