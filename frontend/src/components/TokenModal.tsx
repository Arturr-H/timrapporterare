import React from "react";
import { X } from "lucide-react";

interface TokenModalProps {
    isOpen: boolean;
    githubToken: string;
    asanaToken: string;
    onGithubTokenChange: (token: string) => void;
    onAsanaTokenChange: (token: string) => void;
    onSave: () => void;
    onClose: () => void;
}

const TokenModal: React.FC<TokenModalProps> = ({
    isOpen,
    githubToken,
    asanaToken,
    onGithubTokenChange,
    onAsanaTokenChange,
    onSave,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 max-w-md w-full mx-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-zinc-400" />
                </button>

                <h3 className="text-xl font-medium mb-6">API Tokens</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">GitHub Personal Access Token</label>
                        <input
                            type="password"
                            placeholder="ghp_..."
                            value={githubToken}
                            onChange={(e) => onGithubTokenChange(e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">Asana Personal Access Token</label>
                        <input
                            type="password"
                            placeholder="1/..."
                            value={asanaToken}
                            onChange={(e) => onAsanaTokenChange(e.target.value)}
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors font-medium"
                    >
                        Spara och fortsätt
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        Avbryt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TokenModal;
