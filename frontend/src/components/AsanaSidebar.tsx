// components/AsanaSidebar.tsx
import React from 'react';
import { CheckSquare, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { AsanaTask } from '../Types';
import { DragAndDroppableItem } from './DragAndDrop';

interface AsanaSidebarProps {
    loadingAsana: boolean;
    asanaTasks: AsanaTask[];
    copyToClipboard: (text: string) => void;
}

const AsanaSidebar: React.FC<AsanaSidebarProps> = ({
    loadingAsana,
    asanaTasks,
    copyToClipboard,
}) => {
    return (
        <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full">
            <div className="p-6 pb-0">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-brand-500" />
                    Asana Tasks
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {loadingAsana ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                ) : asanaTasks.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Inga aktiva tasks hittades</p>
                ) : (
                    <div className="space-y-3">
                        {asanaTasks.map(task => (
                            <DragAndDroppableItem data={task} key={task.gid} infinite>
                                <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-gray-300 flex-1">{task.name}</p>
                                        <div className="flex items-center gap-1">
                                            <button
                                            onClick={() => window.open(task.permalink_url, '_blank')}
                                            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                                            title="Öppna i Asana"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(task.permalink_url)}
                                            className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                                            title="Kopiera länk"
                                        >
                                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                        </button>
                                    </div>
                                </div>
                                {task.due_on && (
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Deadline: {new Date(task.due_on).toLocaleDateString('sv-SE')}
                                    </p>
                                )}
                            </div>
                            </DragAndDroppableItem>
                        ))}
                    </div>
                )}
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent z-50"></div>
        </div>
    );
};

export default AsanaSidebar;
