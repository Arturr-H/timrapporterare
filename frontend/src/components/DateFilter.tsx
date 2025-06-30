import React from "react";
import { Calendar } from "lucide-react";

interface DateFilterProps {
    selectedFilters: string[];
    onFilterChange: (filters: string[]) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ selectedFilters, onFilterChange }) => {
    const today = new Date();
    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
    
    // Generera filter för de senaste 7 dagarna
    const generateDateFilters = () => {
        const filters = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            let label = '';
            if (i === 0) {
                label = 'Idag';
            } else if (i === 1) {
                label = 'Igår';
            } else {
                label = dayNames[date.getDay()];
            }
            
            filters.push({
                label,
                value: date.toISOString().split('T')[0], // YYYY-MM-DD format
                date: date
            });
        }
        
        return filters;
    };
    
    const dateFilters = generateDateFilters();
    
    const toggleFilter = (filterValue: string) => {
        if (selectedFilters.includes(filterValue)) {
            onFilterChange(selectedFilters.filter(f => f !== filterValue));
        } else {
            onFilterChange([...selectedFilters, filterValue]);
        }
    };
    
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-zinc-400">
                <Calendar className="w-4 h-4" />
                <span>Filter:</span>
            </div>
            {dateFilters.map((filter) => (
                <button
                    key={filter.value}
                    onClick={() => toggleFilter(filter.value)}
                    className={`px-3 py-1 text-sm rounded-full transition-all ${
                        selectedFilters.includes(filter.value)
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                >
                    {filter.label}
                </button>
            ))}
            {selectedFilters.length > 0 && (
                <button
                    onClick={() => onFilterChange([])}
                    className="px-3 py-1 text-sm rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                >
                    Rensa filter
                </button>
            )}
        </div>
    );
};

export default DateFilter;
