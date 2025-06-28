import React, { createContext, useContext, useState, ReactNode } from "react";

type DragContextType = {
    dragging: boolean;
    setDragging: (v: boolean) => void;
    draggedData: string | null;
    setDraggedData: (v: string | null) => void;
};

const DragContext = createContext<DragContextType>({
    dragging: false,
    setDragging: () => { },
    draggedData: null,
    setDraggedData: () => { },
});

export const DragProvider = ({ children }: { children: ReactNode }) => {
    const [dragging, setDragging] = useState(false);
    const [draggedData, setDraggedData] = useState<string | null>(null);

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
    data: string;
    infinite?: boolean;
    children: ReactNode;
};

export const DragAndDroppableItem = ({ data, infinite = false, children }: DragAndDroppableItemProps) => {
    const { setDragging, setDraggedData } = useContext(DragContext);

    const onDragStart = (e: React.DragEvent) => {
        setDragging(true);
        setDraggedData(data);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", data);
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
    width?: string;
    height?: string;
    items: string[];
    onChange: (items: string[]) => void;
};

export const DropArea = ({ width = "200px", height = "150px", items, onChange }: DropAreaProps) => {
    const { dragging, draggedData } = useContext(DragContext);
    const [showFloatingList, setShowFloatingList] = useState(false);

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text/plain");
        if (data && !items.includes(data)) {
            onChange([...items, data]);
        }
    };

    const removeItem = (itemToRemove: string) => {
        onChange(items.filter((i) => i !== itemToRemove));
    };

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const floatingList = document.querySelector("[data-role='floating-list-selector']");
            console.log("Floating list:", floatingList, "Target:", target);
            if (floatingList && !floatingList.contains(target) && !target.closest("[data-role='drop-area']")) {
                setShowFloatingList(false);
            }
        };

        if (showFloatingList) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [showFloatingList]);

    return (
        <div
            className={`
                border-4 relative p-2
                ${dragging ? "border-dashed border-green-500" : "border-transparent"}
                rounded-xl transition-all
                justify-center items-center flex
            `}
            data-role="floating-list-selector"
            style={{ width, height }}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={() => setShowFloatingList(true)}
        >
            {/* Visa droppade items */}
            <div className="flex flex-wrap gap-1">
                {/* {items.map((item) => (
                    <div
                        key={item}
                        onClick={() => setShowFloatingList(true)}
                        className="bg-gray-200 px-2 rounded cursor-pointer"
                    >
                        {item}
                    </div>
                ))} */}

                <p className={`text-sm ${items.length === 0 ? "text-gray-500" : "text-gray-300"}`}>
                    {items.length === 0 && dragging ? "Droppa här" : `${items.length} task${items.length !== 1 ? "s" : ""} tilldelad${items.length !== 1 ? "e" : ""}`}
                </p>
            </div>

            {/* Flytande lista för att ta bort */}
            {showFloatingList && (
                <div
                    className="absolute top-0 left-0 p-2 rounded shadow max-w-xs max-h-40 overflow-auto z-50"
                    data-role="floating-list-selector"
                >
                    <h4 className="font-semibold mb-2">Ta bort:</h4>
                    {items.map((item) => (
                        <div key={item} className="flex justify-between items-center mb-1">
                            <span>{item}</span>
                            <button
                                onClick={() => removeItem(item)}
                                className="text-red-600 font-bold px-1"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
