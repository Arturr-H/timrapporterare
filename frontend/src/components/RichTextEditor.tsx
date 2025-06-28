import { FileText, ClipboardCopy, Trash2, Brain, Loader2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface SimpleTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}
const SimpleTextEditor = ({ value = "", onChange, placeholder = "Skriv här..." }: SimpleTextEditorProps) => {
    const [content, setContent] = useState<string>(value);
    const editorRef = useRef<HTMLDivElement>(null);
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/g;

    const formatTextWithLinks = (text: string) => {
        if (!text) return "";
        // Ersätt newlines med <br>
        const withLineBreaks = text.replace(/\n/g, "<br>");
        return withLineBreaks.replace(urlRegex, '<span style="color: #3b82f6;">$1</span>');
    };

    const stripHtmlTags = (html: string) => {
        const temp = document.createElement("div");
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || "";
    };

    const handleInput = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

        let cursorOffset = 0;

        if (range) {
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(editor);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            cursorOffset = stripHtmlTags(preCaretRange.toString()).length;
        }

        const plainText = stripHtmlTags(editor.innerHTML);
        const formattedText = formatTextWithLinks(plainText);
        editor.innerHTML = formattedText || "<br>";

        if (range) {
            const textNodes = [];
            const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
            let node;
            while (node = walker.nextNode()) textNodes.push(node);

            let charCount = 0;
            for (const textNode of textNodes) {
                const nodeLength = textNode.textContent?.length;
                if (nodeLength && charCount + nodeLength >= cursorOffset) {
                    const newRange = document.createRange();
                    newRange.setStart(textNode, Math.min(cursorOffset - charCount, nodeLength));
                    newRange.collapse(true);
                    selection?.removeAllRanges();
                    selection?.addRange(newRange);
                    break;
                }
                charCount += nodeLength || 0;
            }
        }

        setContent(plainText);
        if (onChange) onChange(plainText);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key)) e.preventDefault();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();

        // @ts-ignore
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(paste);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
    };

    useEffect(() => {
        if (editorRef.current && value !== content) {
            const formattedText = formatTextWithLinks(value);
            editorRef.current.innerHTML = formattedText || "<br>";
            setContent(value);
        }
    }, [value]);

    return (
        <div className="relative w-full">
            {content === "" && (
                <div className="absolute top-4 left-4 text-zinc-500 pointer-events-none z-10">
                    {placeholder}
                </div>
            )}
            <div
                ref={editorRef}
                contentEditable
                className="min-h-[200px] p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y overflow-auto"
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                style={{
                    lineHeight: "1.6",
                    wordBreak: "break-word",
                    fontFamily: "inherit"
                }}
                suppressContentEditableWarning={true}
            />
        </div>
    );
};

interface TimeReportNotesProps {
    generateSuggestion: () => Promise<string>;
}
const TimeReportNotes = ({ generateSuggestion }: TimeReportNotesProps) => {
    const [notes, setNotes] = useState("");
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("timeReportNotes");
        if (saved) setNotes(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem("timeReportNotes", notes);
    }, [notes]);

    const handleCopy = () => {
        navigator.clipboard.writeText(notes).then(() => {
            console.log("Anteckningar kopierade till urklipp!");
        });
    };

    const handleClear = () => {
        if (window.confirm("Är du säker på att du vill radera dina anteckningar?")) {
            setNotes("");
            localStorage.removeItem("timeReportNotes");
        }
    };

    const handleGenerateSuggestion = async () => {
        if (loadingSuggestion) return;
        setLoadingSuggestion(true);
        try {
            const suggestion = await generateSuggestion();
            if (suggestion) {
                setNotes(suggestion);
            }
        } catch (error) {
            console.error("Error generating suggestion:", error);
        } finally {
            setLoadingSuggestion(false);
        }
    };

    return (
        <div className="mx-auto space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-500" />
                        Rapport
                    </h3>

                    <div className="flex flex-1 items-center gap-2">
                        <button
                            disabled={loadingSuggestion}
                            onClick={() => handleGenerateSuggestion()}
                            className="relative px-4 py-2 bg-brand-700 hover:bg-brand-600 rounded-lg transition-colors font-medium text-white flex items-center gap-2 ml-auto justify-center"
                        >
                            <span
                                className="flex items-center gap-2 transition-opacity duration-300"
                                style={{ opacity: loadingSuggestion ? 0 : 1 }}
                            >
                                <Brain className="w-4 h-4" /> Super AI 2000 förslag
                            </span>

                            {loadingSuggestion && (
                                <div className="absolute inset-0 flex items-center justify-center bg-brand-700 bg-opacity-50 rounded-lg">
                                    <Loader2 className="w-5 h-5 animate-spin text-brand-200" />
                                </div>
                            )}
                        </button>

                        <button
                            onClick={handleCopy}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-600 rounded-lg transition-colors font-medium text-white flex items-center gap-2"
                        >
                            <ClipboardCopy className="w-4 h-4" /> Kopiera
                        </button>

                        <button
                            onClick={handleClear}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium text-white flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Radera
                        </button>
                    </div>
                </div>

                <SimpleTextEditor
                    value={notes}
                    onChange={setNotes}
                    placeholder="Skriv din tidrapport här..."
                />
            </div>
        </div>
    );
};

export default TimeReportNotes;
