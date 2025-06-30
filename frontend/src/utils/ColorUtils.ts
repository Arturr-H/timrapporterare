export const getColorForSection = (section: string): { bg: string; text: string; border: string } => {
    const colors = [
        // Vibranta
        { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
        { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
        { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
        { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
        { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
        { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
        // Pastell
        { bg: 'bg-indigo-400/15', text: 'text-indigo-300', border: 'border-indigo-400/25' },
        { bg: 'bg-teal-400/15', text: 'text-teal-300', border: 'border-teal-400/25' },
        { bg: 'bg-orange-400/15', text: 'text-orange-300', border: 'border-orange-400/25' },
        { bg: 'bg-cyan-400/15', text: 'text-cyan-300', border: 'border-cyan-400/25' },
        { bg: 'bg-rose-400/15', text: 'text-rose-300', border: 'border-rose-400/25' },
        { bg: 'bg-emerald-400/15', text: 'text-emerald-300', border: 'border-emerald-400/25' },
    ];
    
    let hash = 0;
    for (let i = 0; i < section.length; i++) {
        hash = section.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
};
