import { Trash2, X } from "lucide-react";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { AsanaTask } from "../Types";

type DragContextType = {
    dragging: boolean;
    setDragging: (v: boolean) => void;
    draggedData: AsanaTask | null;
    setDraggedData: (v: AsanaTask | null) => void;
};

const DragContext = createContext<DragContextType>({
    dragging: false,
    setDragging: () => { },
    draggedData: null,
    setDraggedData: () => { },
});

export const DragProvider = ({ children }: { children: ReactNode }) => {
    const [dragging, setDragging] = useState(false);
    const [draggedData, setDraggedData] = useState<AsanaTask | null>(null);

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


    return (
        <DragContext.Provider value={{ dragging, setDragging, draggedData, setDraggedData }}>
            {children}
        </DragContext.Provider>
    );
};


type DragAndDroppableItemProps = {
    data: AsanaTask;
    infinite?: boolean;
    children: ReactNode;
};

export const DragAndDroppableItem = ({ data, infinite = false, children }: DragAndDroppableItemProps) => {
    const { setDragging, setDraggedData } = useContext(DragContext);

    const onDragStart = (e: React.DragEvent) => {
        setDragging(true);
        setDraggedData(data);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify(data));
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
            className="cursor-grab active:cursor-grabbing select-none"
        >
            {children}
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
    const { dragging, draggedData } = useContext(DragContext);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent) => {
        if (!isActive) return; // Ignore drop if not active
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;
        
        try {
            const parsedData: AsanaTask = JSON.parse(data);
            if (dragging && parsedData && !items.includes(parsedData)) {
                onChange([...items, parsedData]);
            }
        } catch (error) {
            console.error("Failed to parse dropped data:", error);
        }
    };

    const removeItem = (itemToRemove: AsanaTask) => {
        onChange(items.filter((i) => i !== itemToRemove));
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
            <p className={`text-sm ${items.length === 0 ? "text-gray-300" : "text-gray-300"} whitespace-nowrap`}>
                {items.length === 0 ? "" : `${items.length} task${items.length !== 1 ? "s" : ""} tilldelad${items.length !== 1 ? "e" : ""}`}
            </p>

            {items.length > 0 && (
                <div asana-logo className="w-4 h-4">
                    <svg width="100%" height="100%" viewBox="0 0 256 237" version="1.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                        <title>Asana</title>
                        <g>
                            <path d="M200.324957,125.270044 C169.575962,125.270044 144.649915,150.19729 144.649915,180.947483 C144.649915,211.696478 169.575962,236.623724 200.324957,236.623724 C231.073952,236.623724 256,211.696478 256,180.947483 C256,150.19729 231.073952,125.270044 200.324957,125.270044 L200.324957,125.270044 Z M55.6754021,125.274837 C24.9270063,125.274837 0,150.19729 0,180.947483 C0,211.696478 24.9270063,236.623724 55.6754021,236.623724 C86.425116,236.623724 111.35332,211.696478 111.35332,180.947483 C111.35332,150.19729 86.425116,125.274837 55.6754021,125.274837 L55.6754021,125.274837 Z M183.674444,55.674204 C183.674444,86.425116 158.748396,111.354638 128.000599,111.354638 C97.2505258,111.354638 72.3247177,86.425116 72.3247177,55.674204 C72.3247177,24.9294026 97.2505258,0 128.000599,0 C158.748396,0 183.674444,24.9294026 183.674444,55.674204 L183.674444,55.674204 Z" fill="#F06A6A"></path>
                        </g>
                    </svg>
                </div>
            )}
        </div>
    )
}







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
                className="max-h-60 w-80 overflow-y-auto bg-zinc-800 rounded-tl-lg rounded-tr-lg shadow-lg border border-zinc-700"
                style={{ transform: "translatey(5px)" }}
            >
                <p className="px-4 py-2 text-sm text-gray-400">
                    Tilldelade Asana Tasks
                </p>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (close) close();
                    }}
                    className="absolute top-1 right-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600 bg-zinc-700 rounded-lg p-1 transition-colors"
                    title="Stäng meny"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="max-h-60 w-80 overflow-y-auto bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 z-5">
                {items.map((item, i) => <>
                    <div
                        key={i}
                        className="pl-4 pr-2 py-2 cursor-pointer transition-colors flex items-center justify-between gap-4"
                    >
                        <p className="text-sm text-gray-300">
                            {item.name}
                        </p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                removeItem(item);
                                if (close) close();
                            }}
                            className="min-w-8 min-h-8 ml-2 text-red-500 hover:text-red-300 hover:bg-red-600 bg-zinc-700 rounded-lg flex items-center justify-center transition-colors"
                            title={`Delete ${item}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {i < items.length - 1 && <hr className="border-zinc-700" />}
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

