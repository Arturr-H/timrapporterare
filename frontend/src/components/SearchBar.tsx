import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    className?: string;
    darker?: boolean;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    setSearchQuery,
    className,
    darker = false,
    placeholder = "Sök...",
}) => {
    return (
        <div className={`relative ${className || ''}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-500 dark:text-zinc-500" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className={`
                    w-full pl-10 pr-3 py-2 border ${darker ? `border-gray-200 dark:border-zinc-800`: `border-gray-300 dark:border-zinc-700`}
                    rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
                    transition-colors ${darker ? 'bg-gray-50 dark:bg-zinc-900' : 'bg-white dark:bg-zinc-800'} pr-9
                    text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500`}
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
