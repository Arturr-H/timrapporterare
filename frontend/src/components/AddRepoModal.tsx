import React from "react";
import { X } from "lucide-react";

interface AddRepoModalProps {
    isOpen: boolean;
    repoUrl: string;
    onRepoUrlChange: (url: string) => void;
    onAdd: () => void;
    onClose: () => void;
}

const AddRepoModal: React.FC<AddRepoModalProps> = ({
    isOpen,
    repoUrl,
    onRepoUrlChange,
    onAdd,
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

                <h3 className="text-xl font-medium mb-6">Lägg till repository</h3>

                <input
                    type="text"
                    placeholder="https://github.com/org/repo"
                    value={repoUrl}
                    onChange={(e) => onRepoUrlChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && onAdd()}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none mb-6"
                    autoFocus
                />

                <div className="flex gap-3">
                    <button
                        onClick={onAdd}
                        className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors font-medium"
                    >
                        Lägg till
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

export default AddRepoModal;
