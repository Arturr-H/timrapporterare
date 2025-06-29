// components/AsanaSidebar.tsx
import React from 'react';
import { CheckSquare, ExternalLink, Copy, Loader2, Search } from 'lucide-react';
import { AsanaTask } from '../Types';
import { DragAndDroppableItem } from './DragAndDrop';
import { SearchBar } from './SearchBar';

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
    const [prSearchQuery, setPrSearchQuery] = React.useState('');

    // Filter tasks based on search query
    const filteredTasks = asanaTasks.filter(task =>
        task.name.toLowerCase().includes(prSearchQuery.toLowerCase())
    );
    
    // Use filtered tasks for rendering
    const displayTasks = prSearchQuery ? filteredTasks : asanaTasks;

    return (
        <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full">
            <div className="p-6 pb-0">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-brand-500" />
                    Asana Tasks
                </h3>
            </div>

            <div className="px-6">
            <SearchBar
                darker
                searchQuery={prSearchQuery}
                setSearchQuery={setPrSearchQuery}
                className="relative flex-1 max-w-xs mb-4"
            />
            </div>

            <div className="flex-1 relative px-3 max-h-[50%]">
                {loadingAsana ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                ) : displayTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-40 flex-col space-y-3 px-8">
                        <Search className="w-8 h-8 text-zinc-500" />
                        <p className="text-zinc-500 text-sm break-all">Inga aktiva tasks hittades för "{prSearchQuery}"</p>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto max-h-[100%] px-3 py-3">
                        {displayTasks.map(task => (
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

                {/* Gradient top */}
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-zinc-950 to-transparent z-10" />

                {/* Gradient bottom */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
            </div>

            <p className="text-xs text-zinc-500 px-6 py-2 pt-4">
                Asana tasks är hämtade från ditt konto. Du kan dra en task mot en selekterad pull request för att koppla den.
            </p>

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent z-50"></div>
        </div>
    );
};

export default AsanaSidebar;
