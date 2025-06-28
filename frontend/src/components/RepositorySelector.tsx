import React, { useState } from "react";
import { GitBranch, Star, Plus, X, ChevronDown } from "lucide-react";
import { Repository } from "../Types";

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
                <label className="text-sm text-zinc-400">Välj repository</label>
                <button
                    onClick={onOpenTokenModal}
                    className="text-xs text-brand-400 hover:text-brand-300"
                >
                    Ändra tokens
                </button>
            </div>
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-zinc-500" />
                        {selectedRepo ? repos.find(r => r.full_name === selectedRepo)?.name : "Välj ett repository..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl">
                        <div className="max-h-64 overflow-y-auto">
                            {repos.map(repo => (
                                <div
                                    key={repo.id}
                                    className="px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors group rounded-lg"
                                >
                                    <button
                                        onClick={() => {
                                            onSelectRepo(repo.full_name);
                                            setDropdownOpen(false);
                                        }}
                                        className="flex-1 flex items-center gap-2 text-left"
                                    >
                                        <GitBranch className="w-4 h-4 text-zinc-500" />
                                        <span>{repo.name}</span>
                                        {repo.organization && (
                                            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                                                {repo.organization}
                                            </span>
                                        )}
                                        {repo.private && (
                                            <span className="text-xs bg-brand-900/30 text-brand-400 px-2 py-0.5 rounded">
                                                Private
                                            </span>
                                        )}
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite(repo.id);
                                            }}
                                            className="p-1 hover:bg-zinc-700 rounded"
                                        >
                                            <Star
                                                className={`w-4 h-4 ${favorites.includes(String(repo.id)) ? "fill-yellow-500 text-yellow-500" : "text-zinc-500"}`}
                                            />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveRepo(repo.full_name);
                                            }}
                                            className="p-1 hover:bg-zinc-700 rounded opacity-[0.4] group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4 text-zinc-500" />
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
                            className="w-full px-4 py-3 flex items-center gap-2 hover:bg-zinc-800 transition-colors border-t border-zinc-800 rounded-lg"
                        >
                            <Plus className="w-4 h-4 text-brand-500" />
                            <span className="text-brand-400">Add repo</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepositorySelector;
