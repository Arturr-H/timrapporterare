

interface WordTagProps {
    word: string;
    className: string;
}

export const WordTag: React.FC<WordTagProps> = ({ word, className }) => {
    return (
        <span className={`text-xs ${className} px-2 py-0.5 rounded`}>
            {word}
        </span>
    );
}
