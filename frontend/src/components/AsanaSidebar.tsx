import React from 'react';
import { CheckSquare, ExternalLink, Copy, Loader2, Search, Settings } from 'lucide-react';
import { AsanaTask } from '../Types';
import { DragAndDroppableItem } from './DragAndDrop';
import { SearchBar } from './SearchBar';

interface AsanaSidebarProps {
    loadingAsana: boolean;
    asanaTasks: AsanaTask[];
    copyToClipboard: (text: string) => void;
    onOpenSettings: () => void;
}

const AsanaSidebar: React.FC<AsanaSidebarProps> = ({
    loadingAsana,
    asanaTasks,
    copyToClipboard,
    onOpenSettings,
}) => {
    const [prSearchQuery, setPrSearchQuery] = React.useState('');

    // Filter tasks based on search query
    const filteredTasks = asanaTasks.filter(task =>
        task.name.toLowerCase().includes(prSearchQuery.toLowerCase())
    );
    
    // Use filtered tasks for rendering
    const displayTasks = prSearchQuery ? filteredTasks : asanaTasks;

    return (
        <div className="w-80 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 flex flex-col h-full">
            <div className="p-6 pb-0">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
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

            <div className="flex-1 relative px-3 overflow-hidden">
                {loadingAsana ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                ) : displayTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-40 flex-col space-y-3 px-8">
                        <Search className="w-8 h-8 text-gray-400 dark:text-zinc-500" />
                        <p className="text-gray-600 dark:text-zinc-500 text-sm break-all text-center">
                            {prSearchQuery ? `Inga aktiva tasks hittades för "${prSearchQuery}"` : 'Inga aktiva tasks'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto max-h-full px-3 py-3" data-keyboard-scroll-container>
                        {displayTasks.map((task, index) => (
                            <DragAndDroppableItem 
                                data={task} 
                                index={index}
                                allTasks={displayTasks}
                                key={task.gid} 
                                infinite
                            >
                                <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1" data-keyboard-searchable>{task.name}</p>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(task.permalink_url, '_blank');
                                                }}
                                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded transition-colors"
                                                title="Öppna i Asana"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyToClipboard(task.permalink_url);
                                                }}
                                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded transition-colors"
                                                title="Kopiera länk"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                                            </button>
                                        </div>
                                    </div>
                                    {task.due_on && (
                                        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                                            Deadline: {new Date(task.due_on).toLocaleDateString('sv-SE')}
                                        </p>
                                    )}
                                </div>
                            </DragAndDroppableItem>
                        ))}
                    </div>
                )}

                {/* Gradient top */}
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white dark:from-zinc-950 to-transparent z-10" />

                {/* Gradient bottom */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent z-10" />
            </div>

            <div className="p-6 pt-2 space-y-4">
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                    Tips: Håll Shift och klicka för att välja flera tasks. Dra valda tasks till en PR för att koppla dem.
                </p>
                
                {/* Settings button */}
                <button
                    onClick={onOpenSettings}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Inställningar
                </button>
            </div>
        </div>
    );
};

export default AsanaSidebar;
