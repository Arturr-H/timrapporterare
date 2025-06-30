import React from 'react';
import { Settings, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { AsanaTask } from '../Types';
import { DragAndDroppableItem } from './DragAndDrop';
import { SearchBar } from './SearchBar';
import { getColorForSection } from '../utils/ColorUtils';
import { WordTag } from './WordTag';
import AsanaIcon from '../assets/AsanaIcon';

interface AsanaSidebarProps {
    loadingAsana: boolean;
    asanaTasks: AsanaTask[];
    copyToClipboard: (text: string) => void;
    onOpenSettings: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

const AsanaSidebar: React.FC<AsanaSidebarProps> = ({
    loadingAsana,
    asanaTasks,
    copyToClipboard,
    onOpenSettings,
}) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [prSearchQuery, setPrSearchQuery] = React.useState('');
    const [selectedSection, setSelectedSection] = React.useState<string | null>(null);

    // Get unique sections
    const sections = Array.from(new Set(asanaTasks.map(task => task.section).filter(Boolean))) as string[];

    // Filter tasks
    let filteredTasks = asanaTasks;
    if (prSearchQuery) {
        filteredTasks = filteredTasks.filter(task =>
            task.name.toLowerCase().includes(prSearchQuery.toLowerCase())
        );
    }
    if (selectedSection) {
        filteredTasks = filteredTasks.filter(task => task.section === selectedSection);
    }

    return (
        <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 flex flex-col h-full transition-all duration-300 ease-in-out`}>
            
            {/* Header: title (if open) + toggle button */}
            <div className="p-3 flex items-center justify-between">
                {!isCollapsed ? (
                    <h3 className="text-lg font-medium flex items-center gap-2 text-gray-900 dark:text-white ml-4">
                        <div className="w-5 h-5">
                            <AsanaIcon />
                        </div>

                        Asana Tasks
                    </h3>
                ) : (
                    <div className="w-5 h-5" /> // placeholder for alignment
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title={isCollapsed ? "Expandera" : "Minimera"}
                >
                    {isCollapsed ? <PanelLeftOpen className="w-5 h-5 text-zinc-400" /> : <PanelLeftClose className="w-5 h-5 text-zinc-400" />}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Search och section filter */}
                    <div className="px-6 space-y-3">
                        <SearchBar
                            darker
                            searchQuery={prSearchQuery}
                            setSearchQuery={setPrSearchQuery}
                            className="relative flex-1 max-w-xs"
                        />
                        
                        {/* Section filter */}
                        {sections.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setSelectedSection(null)}
                                    className={`px-2 py-1 text-xs rounded-full transition-all ${
                                        !selectedSection 
                                            ? 'bg-brand-600 text-white' 
                                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    Alla
                                </button>
                                {sections.map(section => {
                                    const colors = getColorForSection(section);
                                    return (
                                        <button
                                            key={section}
                                            onClick={() => setSelectedSection(section === selectedSection ? null : section)}
                                            className={`px-2 py-1 text-xs rounded-full transition-all border ${
                                                section === selectedSection
                                                    ? `${colors.bg} ${colors.text} ${colors.border} border-2`
                                                    : `${colors.bg} ${colors.text} ${colors.border} hover:border-2`
                                            }`}
                                        >
                                            {section}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Tasks list */}
                    <div className="flex-1 relative px-3 overflow-hidden mt-4">
                        {/* ... existing task list code ... */}
                        {/* Lägg till section tag i varje task: */}
                        <div className="space-y-3 overflow-y-auto max-h-full px-3 py-3">
                            {filteredTasks.map((task, index) => (
                                <DragAndDroppableItem 
                                    data={task} 
                                    index={index}
                                    allTasks={filteredTasks}
                                    key={task.gid} 
                                    infinite
                                >
                                    <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{task.name}</p>
                                                {task.section && (
                                                    <div className="mt-1">
                                                        <WordTag
                                                            word={task.section} 
                                                            className={`${getColorForSection(task.section).bg} ${getColorForSection(task.section).text} ${getColorForSection(task.section).border} border`}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            {/* ... existing buttons ... */}
                                        </div>
                                    </div>
                                </DragAndDroppableItem>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Settings button - alltid synlig */}
            <div className={`p-6 pt-2 mt-auto ${isCollapsed ? 'px-3' : ''}`}>
                <button
                    onClick={onOpenSettings}
                    className={`w-full py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 ${isCollapsed ? 'justify-center p-2' : 'px-4'}`}
                    title={isCollapsed ? "Inställningar" : undefined}
                >
                    <Settings className="w-5 h-5" />
                    {!isCollapsed && "Inställningar"}
                </button>
            </div>
        </div>
    );
};

export default AsanaSidebar;
