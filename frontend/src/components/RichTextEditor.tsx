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
        const plainText = stripHtmlTags(editor.innerHTML);
        setContent(plainText);
        if (onChange) onChange(plainText);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key)) e.preventDefault();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const paste = (e.clipboardData || (window as any).clipboardData).getData('text');
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
                <div className="absolute top-4 left-4 text-gray-500 dark:text-zinc-500 pointer-events-none z-10">
                    {placeholder}
                </div>
            )}
            <div
                ref={editorRef}
                contentEditable
                className="min-h-[200px] p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y overflow-auto"
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
    generateSuggestion: () => Promise<void>;
}

const TimeReportNotes = ({ generateSuggestion }: TimeReportNotesProps) => {
    const [notes, setNotes] = useState("");
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);
    const [streamingText, setStreamingText] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("timeReportNotes");
        if (saved) setNotes(saved);
    }, []);

    useEffect(() => {
        if (!isStreaming) {
            localStorage.setItem("timeReportNotes", notes);
        }
    }, [notes, isStreaming]);

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
        if (loadingSuggestion || isStreaming) return;

        setLoadingSuggestion(true);
        setStreamingText("");
        setNotes(""); // Clear existing text

        try {
            const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8086";

            // Get the data from parent component
            const prData = await generateSuggestion();
            /*
            // Use EventSource for Server-Sent Events
            const eventSource = new EventSource(`${API_URL}/api/generate-time-report-stream`);
            
            let accumulatedText = "";
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'start') {
                    setLoadingSuggestion(false);
                    setIsStreaming(true);
                } else if (data.type === 'content') {
                    // Replace escaped newlines with actual newlines
                    const content = data.content.replace(/\\n/g, '\n');
                    accumulatedText += content;
                    setStreamingText(accumulatedText);
                    setNotes(accumulatedText);
                } else if (data.type === 'complete') {
                    setIsStreaming(false);
                    eventSource.close();
                } else if (data.type === 'error') {
                    console.error("Stream error:", data.message);
                    setLoadingSuggestion(false);
                    setIsStreaming(false);
                    eventSource.close();
                }
            };
            
            eventSource.onerror = (error) => {
                console.error("EventSource error:", error);
                setLoadingSuggestion(false);
                setIsStreaming(false);
                eventSource.close();
            };*/

            // Alternative: Use fetch with ReadableStream (if EventSource doesn't work)
            const response = await fetch(`${API_URL}/api/generate-time-report-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('github_token')}`
                },
                body: JSON.stringify(prData)
            });

            if (!response.ok) throw new Error('Stream request failed');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            setLoadingSuggestion(false);
            setIsStreaming(true);

            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                console.log("Received chunk:", chunk);

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            console.log("Processing line:", line);
                            const data = parseData(line);
                            console.log("Parsed data:", data);
                            if (data.type === ResponseType.Content) {
                                accumulatedText += data.value.replace(/\\n/g, '\n');
                                setStreamingText(accumulatedText);
                                setNotes(accumulatedText);
                            } else if (data.type === ResponseType.Complete) {
                                console.log("Stream complete");
                                setIsStreaming(false);
                                return;
                            }
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }
                }
            }

            setIsStreaming(false);

        } catch (error) {
            console.error("Error generating suggestion:", error);
            setLoadingSuggestion(false);
            setIsStreaming(false);
        }
    };

    return (
        <div className="mx-auto space-y-6">
            <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <FileText className="w-5 h-5 text-brand-500" />
                        Rapport
                    </h3>

                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <button
                            disabled={loadingSuggestion || isStreaming}
                            onClick={handleGenerateSuggestion}
                            className="relative px-4 py-2 bg-brand-700 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-white flex items-center gap-2 md:ml-auto justify-center w-full md:w-auto"
                        >
                            {isStreaming ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    Skriver...
                                </span>
                            ) : (
                                <>
                                    <span
                                        className="flex items-center gap-2 transition-opacity duration-300"
                                        style={{ opacity: loadingSuggestion ? 0 : 1 }}
                                    >
                                        <Brain className="w-4 h-4" />
                                    </span>

                                    {loadingSuggestion && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-brand-700 bg-opacity-50 rounded-lg">
                                            <Loader2 className="w-5 h-5 animate-spin text-brand-200" />
                                        </div>
                                    )}
                                </>
                            )}
                        </button>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={handleCopy}
                                disabled={isStreaming}
                                className="flex-1 md:flex-initial px-4 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-gray-900 dark:text-white flex items-center gap-2 justify-center"
                            >
                                <ClipboardCopy className="w-4 h-4" /> Kopiera
                            </button>

                            <button
                                onClick={handleClear}
                                disabled={isStreaming}
                                className="flex-1 md:flex-initial px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium text-white flex items-center gap-2 justify-center"
                            >
                                <Trash2 className="w-4 h-4" /> Radera
                            </button>
                        </div>
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

enum ResponseType {
    Content = "content",
    Complete = "complete",
    None = "none"
}

type Response =
    | { type: ResponseType.Content; value: string }
    | { type: ResponseType.Complete }
    | { type: ResponseType.None };

function parseData(input: string): Response {
    // Extract JSON-like part of the string
    const jsonMatch = input.match(/{.*}/);
    if (!jsonMatch) return { type: ResponseType.None };

    try {
        // Fix double backslashes and parse JSON
        const cleaned = jsonMatch[0].replace(/\\\\/g, "\\");
        const parsed = JSON.parse(cleaned);

        if (parsed.type === "content" && typeof parsed.content === "string") {
            return { type: ResponseType.Content, value: parsed.content };
        }

        if (parsed.type === "complete") {
            return { type: ResponseType.Complete };
        }
    } catch (e) {
        // If JSON parsing fails
        return { type: ResponseType.None };
    }

    return { type: ResponseType.None };
}

export default TimeReportNotes;
