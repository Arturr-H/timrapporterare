import React, { useState } from "react";
import { Settings, X, Moon, Sun, Key } from "lucide-react";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    githubToken: string;
    asanaToken: string;
    onGithubTokenChange: (token: string) => void;
    onAsanaTokenChange: (token: string) => void;
    onSaveTokens: () => void;
    theme: 'dark' | 'light';
    onThemeChange: (theme: 'dark' | 'light') => void;
}

const themes = [
    { name: 'Lila (Standard)', value: 'purple', color: '#8b5cf6' },
    { name: 'Blå', value: 'blue', color: '#3b82f6' },
    { name: 'Grön', value: 'green', color: '#10b981' },
    { name: 'Röd', value: 'red', color: '#ef4444' },
    { name: 'Orange', value: 'orange', color: '#f97316' },
    { name: 'Rosa', value: 'pink', color: '#ec4899' },
    { name: 'Cyan', value: 'cyan', color: '#06b6d4' },
    { name: 'Teal', value: 'teal', color: '#14b8a6' },
    { name: 'Indigo', value: 'indigo', color: '#6366f1' },
    { name: 'Gul', value: 'yellow', color: '#eab308' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    githubToken,
    asanaToken,
    onGithubTokenChange,
    onAsanaTokenChange,
    onSaveTokens,
    theme,
    onThemeChange,
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'tokens'>('general');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 max-w-2xl w-full mx-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
                </button>

                <div className="flex items-center gap-2 mb-6">
                    <Settings className="w-6 h-6 text-brand-500" />
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">Inställningar</h3>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-6">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2 -mb-px transition-colors ${
                            activeTab === 'general'
                                ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        Allmänt
                    </button>
                    <button
                        onClick={() => setActiveTab('tokens')}
                        className={`px-4 py-2 -mb-px transition-colors ${
                            activeTab === 'tokens'
                                ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        API Tokens
                    </button>
                </div>

                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        {/* tema-toggle */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Utseende</h4>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {theme === 'dark' ? (
                                        <Moon className="w-5 h-5 text-brand-500" />
                                    ) : (
                                        <Sun className="w-5 h-5 text-brand-500" />
                                    )}
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Tema</p>
                                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                                            {theme === 'dark' ? 'Mörkt läge' : 'Ljust läge'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                                    className="relative w-12 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full transition-colors"
                                >
                                    <div
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                            theme === 'dark' ? 'translate-x-6' : ''
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* färgväljare */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Accentfärg</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.value}
                                        onClick={() => {
                                            localStorage.setItem('brandColor', theme.value);
                                            document.documentElement.className = document.documentElement.className
                                                .replace(/brand-\w+/, `brand-${theme.value}`);
                                        }}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <div 
                                            className="w-8 h-8 rounded-full" 
                                            style={{ backgroundColor: theme.color }}
                                        />
                                        <span className="text-xs text-gray-600 dark:text-zinc-400">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tokens Tab */}
                {activeTab === 'tokens' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="w-5 h-5 text-brand-500" />
                            <p className="text-sm text-gray-600 dark:text-zinc-400">
                                Dina API tokens lagras säkert i din webbläsare
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm text-gray-700 dark:text-zinc-400 mb-2">
                                GitHub Personal Access Token
                            </label>
                            <input
                                type="password"
                                placeholder="ghp_..."
                                value={githubToken}
                                onChange={(e) => onGithubTokenChange(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 dark:text-zinc-400 mb-2">
                                Asana Personal Access Token
                            </label>
                            <input
                                type="password"
                                placeholder="1/..."
                                value={asanaToken}
                                onChange={(e) => onAsanaTokenChange(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                        </div>

                        <button
                            onClick={onSaveTokens}
                            className="w-full px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors font-medium text-white mt-6"
                        >
                            Spara tokens
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
