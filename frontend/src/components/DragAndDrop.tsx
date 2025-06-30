import { Trash2, X } from "lucide-react";
import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { AsanaTask } from "../Types";
import AsanaIcon from "../assets/AsanaIcon";

type DragContextType = {
    dragging: boolean;
    setDragging: (v: boolean) => void;
    draggedData: AsanaTask[] | null;
    setDraggedData: (v: AsanaTask[] | null) => void;
    selectedTasks: Set<string>;
    setSelectedTasks: (v: Set<string>) => void;
    lastSelectedIndex: number | null;
    setLastSelectedIndex: (v: number | null) => void;
};

const DragContext = createContext<DragContextType>({
    dragging: false,
    setDragging: () => { },
    draggedData: null,
    setDraggedData: () => { },
    selectedTasks: new Set(),
    setSelectedTasks: () => { },
    lastSelectedIndex: null,
    setLastSelectedIndex: () => { },
});

export const DragProvider = ({ children }: { children: ReactNode }) => {
    const [dragging, setDragging] = useState(false);
    const [draggedData, setDraggedData] = useState<AsanaTask[] | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

    React.useEffect(() => {
        const handleDragEnd = () => {
            setDragging(false);
            setDraggedData(null);
            document.body.classList.remove("cursor-grabbing");
        };

        if (dragging) {
            window.addEventListener("mouseup", handleDragEnd);
        }

        return () => {
            window.removeEventListener("mouseup", handleDragEnd);
            document.body.classList.remove("cursor-grabbing");
        };
    }, [dragging]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedTasks(new Set());
                setLastSelectedIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <DragContext.Provider value={{
            dragging,
            setDragging,
            draggedData,
            setDraggedData,
            selectedTasks,
            setSelectedTasks,
            lastSelectedIndex,
            setLastSelectedIndex
        }}>
            {children}
        </DragContext.Provider>
    );
};

type DragAndDroppableItemProps = {
    data: AsanaTask;
    index: number;
    allTasks: AsanaTask[];
    infinite?: boolean;
    children: ReactNode;
};

export const DragAndDroppableItem = ({ data, index, allTasks, infinite = false, children }: DragAndDroppableItemProps) => {
    const {
        setDragging,
        setDraggedData,
        selectedTasks,
        setSelectedTasks,
        lastSelectedIndex,
        setLastSelectedIndex
    } = useContext(DragContext);
    const isSelected = selectedTasks.has(data.gid);

    const handleClick = (e: React.MouseEvent) => {
        const newSelection = new Set(selectedTasks);
        if (e.shiftKey && lastSelectedIndex !== null) {
            // Just toggle the clicked item, don't select range
            if (isSelected) {
                newSelection.delete(data.gid);
            } else {
                newSelection.add(data.gid);
            }
            setSelectedTasks(newSelection);
            // Don't update lastSelectedIndex on shift-click to maintain range reference
        } else if (e.ctrlKey || e.metaKey) {
            if (isSelected) {
                newSelection.delete(data.gid);
            } else {
                newSelection.add(data.gid);
            }
            setSelectedTasks(newSelection);
            setLastSelectedIndex(index);
        } else {
            // Regular click — toggle this one only
            if (isSelected && selectedTasks.size === 1) {
                newSelection.clear();
            } else {
                newSelection.clear();
                newSelection.add(data.gid);
            }
            setSelectedTasks(newSelection);
            setLastSelectedIndex(index);
        }
    };


    const onDragStart = (e: React.DragEvent) => {
        // If dragging a selected item, drag all selected items
        // If dragging an unselected item, drag only that item
        let itemsToDrag: AsanaTask[];

        if (isSelected && selectedTasks.size > 0) {
            itemsToDrag = allTasks.filter(task => selectedTasks.has(task.gid));
        } else {
            itemsToDrag = [data];
            setSelectedTasks(new Set([data.gid]));
        }

        setDragging(true);
        setDraggedData(itemsToDrag);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify(itemsToDrag));

        e.dataTransfer.setDragImage(new Image(), 0, 0);
    };

    const onDragEnd = () => {
        setDragging(false);
        setDraggedData(null);
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={handleClick}
            className={`cursor-grab active:cursor-grabbing select-none ${isSelected ? 'ring-2 ring-brand-500 rounded-lg' : ''
                }`}
        >
            {children}
        </div>
    );
};

// Drag thumbnail component
// Updated DragThumbnail component with gravity physics
export const DragThumbnail = () => {
    const { dragging, draggedData } = useContext(DragContext);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const velocityRef = useRef({ x: 0, y: 0 });
    const lastPositionRef = useRef({ x: 0, y: 0, time: 0 });
    const animationRef = React.useRef<number | undefined>(undefined);

    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            const currentTime = Date.now();
            const currentPos = { x: e.clientX, y: e.clientY };
            
            // Calculate velocity
            const timeDelta = currentTime - lastPositionRef.current.time;
            if (timeDelta > 0) {
                const deltaX = currentPos.x - lastPositionRef.current.x;
                const deltaY = currentPos.y - lastPositionRef.current.y;
                
                // Smooth velocity calculation with some damping
                const smoothing = 0.3;
                velocityRef.current.x = velocityRef.current.x * (1 - smoothing) + (deltaX / timeDelta) * 1000 * smoothing;
                velocityRef.current.y = velocityRef.current.y * (1 - smoothing) + (deltaY / timeDelta) * 1000 * smoothing;
            }
            
            lastPositionRef.current = { ...currentPos, time: currentTime };
            setPosition(currentPos);
        };

        const updateRotation = () => {
            if (dragging && draggedData?.length) {
                // Calculate rotation based on velocity and gravity
                const { x: vx, y: vy } = velocityRef.current;
                
                // Base gravity effect (item wants to hang down)
                let targetRotation = 0;
                
                // Add rotation based on horizontal velocity
                const velocityMagnitude = Math.sqrt(vx * vx + vy * vy);
                const horizontalInfluence = Math.min(Math.abs(vx) * 0.15, 45); // Max 45 degrees
                
                if (vx > 10) {
                    targetRotation = horizontalInfluence; // Tilt right when moving right
                } else if (vx < -10) {
                    targetRotation = -horizontalInfluence; // Tilt left when moving left
                }
                
                // Add some vertical influence for more natural movement
                if (vy > 50) {
                    targetRotation *= 0.7; // Reduce tilt when moving down fast
                } else if (vy < -50) {
                    targetRotation *= 1.3; // Increase tilt when moving up fast
                }
                
                // Smooth rotation transition
                setRotation(prevRotation => {
                    const rotationDiff = targetRotation - prevRotation;
                    return prevRotation + rotationDiff * 0.15; // Smooth interpolation
                });
                
                // Decay velocity slightly for natural feel
                velocityRef.current.x *= 0.95;
                velocityRef.current.y *= 0.95;
                
                animationRef.current = requestAnimationFrame(updateRotation);
            }
        };

        if (dragging && (draggedData?.length ?? 0) > 0) {
            document.addEventListener("dragover", handleDragOver);
            updateRotation();
        }

        return () => {
            document.removeEventListener("dragover", handleDragOver);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [dragging, draggedData]);

    // Reset rotation when not dragging
    useEffect(() => {
        if (!dragging) {
            setRotation(0);
            velocityRef.current = { x: 0, y: 0 };
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }
    }, [dragging]);

    if (!dragging || !draggedData?.length) return null;

    return (
        <div
            className="fixed pointer-events-none z-[100] bg-zinc-800 rounded-lg px-3 py-2 shadow-lg border border-zinc-700 transition-transform"
            style={{
                left: position.x,
                top: position.y,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: '0 0', // Rotate around top-left corner (where mouse "grabs" it)
            }}
        >
            <p className="text-sm text-gray-300">
                {draggedData.length === 1
                    ? draggedData[0].name.substring(0, 30) + (draggedData[0].name.length > 30 ? '...' : '')
                    : `${draggedData.length} tasks`
                }
            </p>
        </div>
    );
};

type DropAreaProps = {
    items: AsanaTask[];
    onChange: (items: AsanaTask[]) => void;
    children?: ReactNode;
    isActive: boolean;
};

export const DropArea = ({ items, onChange, children, isActive }: DropAreaProps) => {
    const { dragging } = useContext(DragContext);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent) => {
        if (!isActive) return;
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;

        try {
            const parsedData: AsanaTask[] = JSON.parse(data);
            if (dragging && parsedData && parsedData.length > 0) {
                // Filter out tasks that are already in the items
                const newTasks = parsedData.filter(
                    task => !items.some(existingTask => existingTask.gid === task.gid)
                );
                if (newTasks.length > 0) {
                    onChange([...items, ...newTasks]);
                }
            }
        } catch (error) {
            console.error("Failed to parse dropped data:", error);
        }
    };

    return (
        <div
            className={`
                border-4 relative
                ${(dragging && isActive) ? "border-dashed border-brand-500" : "border-transparent"}
                rounded-xl transition-all
            `}
            data-role="floating-list-selector"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {children}
        </div>
    );
};

// Rest of the components remain the same...
interface DropAreaItemsTeaserProps {
    items: AsanaTask[];
    removeItem: (item: AsanaTask) => void;
}

export const DropAreaItemsTeaser: React.FC<DropAreaItemsTeaserProps> = ({ items, removeItem }) => {
    return (
        <div
            className="flex gap-2 items-center flex-nowrap"
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                showContextMenu(e.clientX, e.clientY, items, removeItem);
            }}
        >
            <p className={`text-sm ${items.length === 0 ? "text-gray-300 dark:text-gray-300" : "text-gray-700 dark:text-gray-300"} whitespace-nowrap`}>
                {items.length === 0 ? "" : `${items.length} task${items.length !== 1 ? "s" : ""} tilldelad${items.length !== 1 ? "e" : ""}`}
            </p>

            {items.length > 0 && (
                <div className="w-4 h-4">
                    <AsanaIcon />
                </div>
            )}
        </div>
    )
}

// Context menu components remain the same...
type ContextMenuProps = {
    x: number;
    y: number;
    items: AsanaTask[];
    removeItem: (item: AsanaTask) => void;
    close?: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, removeItem, close }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: y, left: x });

    React.useEffect(() => {
        const el = ref.current;
        if (el) {
            const { innerWidth, innerHeight } = window;
            const rect = el.getBoundingClientRect();
            const adjustedX = x + rect.width > innerWidth ? innerWidth - rect.width - 10 : x;
            const adjustedY = y + rect.height > innerHeight ? innerHeight - rect.height - 10 : y;
            setPosition({ top: adjustedY, left: adjustedX });
        }
    }, [x, y]);

    return (
        <div
            ref={ref}
            style={{ top: position.top, left: position.left, transform: "translateX(-100%)" }}
            className="absolute z-50"
        >
            <div
                className="max-h-60 w-80 overflow-y-auto bg-white dark:bg-zinc-800 rounded-tl-lg rounded-tr-lg shadow-lg border border-gray-200 dark:border-zinc-700"
                style={{ transform: "translatey(5px)" }}
            >
                <p className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Tilldelade Asana Tasks
                </p>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (close) close();
                    }}
                    className="absolute top-1 right-1 text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-600 bg-gray-50 dark:bg-zinc-700 rounded-lg p-1 transition-colors"
                    title="Stäng meny"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="max-h-60 w-80 overflow-y-auto bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-5">
                {items.map((item, i) => <>
                    <div
                        key={i}
                        className="pl-4 pr-2 py-2 cursor-pointer transition-colors flex items-center justify-between gap-4"
                    >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {item.name}
                        </p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeItem(item);
                                if (close) close();
                            }}
                            className="min-w-8 min-h-8 ml-2 text-red-500 hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-600 bg-gray-50 dark:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors"
                            title={`Delete ${item}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {i < items.length - 1 && <hr className="border-gray-200 dark:border-zinc-700" />}
                </>)}
            </div>
        </div>
    );
};

type ContextMenuState = {
    x: number;
    y: number;
    items: AsanaTask[];
    removeItem: (item: AsanaTask) => void;
} | null;

let showMenuFn: ((x: number, y: number, items: AsanaTask[], removeItem: (item: AsanaTask) => void) => void) | null = null;

export const useContextMenu = () => {
    const [state, setState] = useState<ContextMenuState>(null);

    React.useEffect(() => {
        showMenuFn = (x, y, items, removeItem) => {
            setState({ x, y, items, removeItem });
        };

        const handleClick = () => setState(null);
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    const ContextMenuPortal = () =>
        state ? <ContextMenu
            x={state.x}
            y={state.y}
            items={state.items}
            removeItem={state.removeItem}
            close={() => setState(null)}
        /> : null;

    return { ContextMenuPortal };
};

export const showContextMenu = (x: number, y: number, items: AsanaTask[], removeItem: (item: AsanaTask) => void) => {
    showMenuFn?.(x, y, items, removeItem);
};
