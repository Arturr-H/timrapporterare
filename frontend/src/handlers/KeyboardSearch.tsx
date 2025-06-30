import { useEffect, useState } from "react";

export default function KeyboardSearch() {
    const [query, setQuery] = useState("");

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                resetAll();
                setQuery("");
                return;
            }

            if (e.key.length !== 1) return;

            const nextQuery = query + e.key.toLowerCase();
            const elements = document.querySelectorAll<HTMLElement>("[data-keyboard-searchable]");
            let matched = false;

            elements.forEach((el) => {
                const originalText = el.getAttribute("data-original-text") || el.innerText;
                const index = originalText.toLowerCase().indexOf(nextQuery);

                if (index !== -1) {
                    matched = true;
                    const before = originalText.slice(0, index);
                    const match = originalText.slice(index, index + nextQuery.length);
                    const after = originalText.slice(index + nextQuery.length);
                    el.innerHTML = `${before}<mark>${match}</mark>${after}`;
                } else {
                    el.innerHTML = originalText;
                }

                el.setAttribute("data-original-text", originalText);
            });

            if (matched) {
                setQuery(nextQuery);
                scrollToFirstHighlightInEachContainer();
            } else {
                resetAll();
                setQuery("");
            }
        };

        const scrollToFirstHighlightInEachContainer = () => {
            const containers = document.querySelectorAll<HTMLElement>("[data-keyboard-scroll-container]");
            containers.forEach((container) => {
                const highlight = container.querySelector("mark");
                if (highlight) {
                    highlight.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        };

        const resetAll = () => {
            const elements = document.querySelectorAll<HTMLElement>("[data-keyboard-searchable]");
            elements.forEach((el) => {
                const originalText = el.getAttribute("data-original-text");
                if (originalText) {
                    el.innerHTML = originalText;
                }
            });
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [query]);

    return null;
}
