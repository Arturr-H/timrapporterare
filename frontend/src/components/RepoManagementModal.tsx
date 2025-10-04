import React, { useState } from "react";
import { X, Plus, GitBranch, Star, Trash2 } from "lucide-react";
import { Repository } from "../Types";
import { WordTag } from "./WordTag";

interface RepoManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableRepos: Repository[];
    selectedRepoIds: number[];
    favorites: string[];
    onToggleRepoSelection: (repoId: number) => void;
    onToggleFavorite: (repoId: number) => void;
    onRemoveRepo: (fullName: string) => void;
    onAddRepo: () => void;
    onUsernameFilterChange: (filter: string) => void;
}

const RepoManagementModal: React.FC<RepoManagementModalProps> = ({
    isOpen,
    onClose,
    availableRepos,
    selectedRepoIds,
    favorites,
    onToggleRepoSelection,
    onToggleFavorite,
    onRemoveRepo,
    onAddRepo,
    onUsernameFilterChange,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [usernameFilter, setUsernameFilter] = useState(() => {
        return localStorage.getItem('repo_username_filter') || '';
    });

    // Save username filter to localStorage and notify parent whenever it changes
    const handleUsernameFilterChange = (value: string) => {
        setUsernameFilter(value);
        localStorage.setItem('repo_username_filter', value);
        onUsernameFilterChange(value);
    };

    if (!isOpen) return null;

    // Only filter by search query - username filter shouldn't affect repo selection
    const filteredRepos = searchQuery.trim()
        ? availableRepos.filter(repo =>
            repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            repo.organization?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : availableRepos;

    const sortedRepos = [...filteredRepos].sort((a, b) => {
        const aFav = favorites.includes(String(a.id));
        const bFav = favorites.includes(String(b.id));
        const aSelected = selectedRepoIds.includes(a.id);
        const bSelected = selectedRepoIds.includes(b.id);
        
        // Selected repos first, then favorites, then alphabetical
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Manage Repository Selection
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                Filter PRs by author username
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. your-username (filters displayed PRs)..."
                                value={usernameFilter}
                                onChange={(e) => handleUsernameFilterChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Search repositories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mb-4 text-sm text-gray-600 dark:text-zinc-400">
                        <div className="flex items-center justify-between mb-2">
                            <span>Selected repositories ({selectedRepoIds.length}) will show their PRs in the unified list</span>
                            <button
                                onClick={() => {
                                    const allRepoIds = availableRepos.map(repo => repo.id);
                                    allRepoIds.forEach(id => {
                                        if (!selectedRepoIds.includes(id)) {
                                            onToggleRepoSelection(id);
                                        }
                                    });
                                }}
                                className="text-xs px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded transition-colors"
                            >
                                Select All
                            </button>
                        </div>
                        {usernameFilter && (
                            <div className="text-brand-600 dark:text-brand-400">
                                PR author filter active: {usernameFilter}
                            </div>
                        )}
                        {filteredRepos.length !== availableRepos.length && (
                            <div className="mt-1">
                                Showing {filteredRepos.length} of {availableRepos.length} repositories
                            </div>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-zinc-800 rounded-lg">
                        {sortedRepos.map(repo => {
                            const isSelected = selectedRepoIds.includes(repo.id);
                            const isFavorite = favorites.includes(String(repo.id));
                            
                            return (
                                <div
                                    key={repo.id}
                                    className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors border-b border-gray-200 dark:border-zinc-800 last:border-b-0 ${
                                        isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => onToggleRepoSelection(repo.id)}
                                            className="w-4 h-4 text-brand-600 bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 rounded focus:ring-brand-500 focus:ring-2"
                                        />
                                        <GitBranch className="w-4 h-4 text-gray-500 dark:text-zinc-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-gray-900 dark:text-white font-medium truncate">
                                                {repo.name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-zinc-400 truncate">
                                                {repo.full_name}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {repo.organization && (
                                                <WordTag 
                                                    word={repo.organization} 
                                                    className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400" 
                                                />
                                            )}
                                            {repo.private && (
                                                <WordTag 
                                                    word="Private" 
                                                    className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400" 
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                        <button
                                            onClick={() => onToggleFavorite(repo.id)}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors"
                                            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                        >
                                            <Star
                                                className={`w-4 h-4 ${
                                                    isFavorite 
                                                        ? "fill-yellow-500 text-yellow-500" 
                                                        : "text-gray-400 dark:text-zinc-500"
                                                }`}
                                            />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to remove ${repo.name}?`)) {
                                                    onRemoveRepo(repo.full_name);
                                                }
                                            }}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                            title="Remove repository"
                                        >
                                            <Trash2 className="w-4 h-4 text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => {
                            onAddRepo();
                            onClose();
                        }}
                        className="w-full mt-4 px-4 py-3 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Repository
                    </button>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RepoManagementModal;