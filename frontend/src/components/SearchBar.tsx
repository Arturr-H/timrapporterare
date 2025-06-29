import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    className?: string;
    darker?: true;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    searchQuery,
    setSearchQuery,
    className,
    darker = false,
}) => {
    return (
        <div className={`relative ${className || ''}`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-zinc-500" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Sök PR..."
                className={`
                    w-full pl-10 pr-3 py-2 border ${darker ? `border-zinc-800`: `border-zinc-700`}
                    rounded-lg focus:outline-none focus:border-brand-500
                    transition-colors ${darker ? 'bg-zinc-900' : 'bg-zinc-800'} pr-9`}
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
