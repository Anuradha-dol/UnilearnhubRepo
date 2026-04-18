import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

const MENTION_TRIGGER_REGEX = /(?:^|\s)@([A-Za-z][A-Za-z0-9._-]*)$/;

export default function MentionComposerTextarea({
                                                    value,
                                                    onChange,
                                                    placeholder,
                                                    className,
                                                    rows = 3,
                                                    maxLength,
                                                }) {
    const textareaRef = useRef(null);
    const [mentionState, setMentionState] = useState({ query: "", start: -1, end: -1 });
    const [suggestions, setSuggestions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [open, setOpen] = useState(false);

    const shouldSearch = useMemo(() => mentionState.query.trim().length > 0, [mentionState.query]);

    useEffect(() => {
        if (!shouldSearch) {
            return;
        }

        let cancelled = false;

        const runSearch = async () => {
            try {
                const response = await api.get("/user/mention-search", {
                    withCredentials: true,
                    params: { q: mentionState.query, limit: 8 },
                });

                if (cancelled) {
                    return;
                }

                const data = Array.isArray(response.data) ? response.data : [];
                setSuggestions(data);
                setActiveIndex(0);
                setOpen(data.length > 0);
            } catch {
                if (!cancelled) {
                    setSuggestions([]);
                    setOpen(false);
                }
            }
        };

        runSearch();

        return () => {
            cancelled = true;
        };
    }, [mentionState.query, shouldSearch]);

    const updateMentionStateFromInput = (nextValue, cursorPosition) => {
        const safeCursor = Number.isFinite(cursorPosition) ? cursorPosition : nextValue.length;
        const beforeCursor = nextValue.slice(0, safeCursor);
        const match = beforeCursor.match(MENTION_TRIGGER_REGEX);

        if (!match) {
            setMentionState({ query: "", start: -1, end: -1 });
            setSuggestions([]);
            setOpen(false);
            return;
        }

        const query = match[1] || "";
        const start = safeCursor - query.length - 1;
        setMentionState({ query, start, end: safeCursor });
    };

    const handleChange = (event) => {
        const nextValue = event.target.value;
        if (typeof onChange === "function") {
            onChange(nextValue);
        }

        updateMentionStateFromInput(nextValue, event.target.selectionStart);
    };

    const applySuggestion = (suggestion) => {
        if (!suggestion || mentionState.start < 0 || mentionState.end < 0) {
            return;
        }

        const displayName = String(suggestion.displayName || "").trim();
        if (!displayName) {
            return;
        }

        const before = value.slice(0, mentionState.start);
        const after = value.slice(mentionState.end);
        const mentionText = `@${displayName}`;
        const nextValue = `${before}${mentionText} ${after}`;

        if (typeof onChange === "function") {
            onChange(nextValue);
        }

        setMentionState({ query: "", start: -1, end: -1 });
        setSuggestions([]);
        setOpen(false);

        window.requestAnimationFrame(() => {
            if (!textareaRef.current) {
                return;
            }
            textareaRef.current.focus();
            const cursor = before.length + mentionText.length + 1;
            textareaRef.current.setSelectionRange(cursor, cursor);
        });
    };

    const handleKeyDown = (event) => {
        if (!open || suggestions.length === 0) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % suggestions.length);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            applySuggestion(suggestions[activeIndex]);
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
        }
    };

    return (
        <div className="relative">
      <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          rows={rows}
          maxLength={maxLength}
      />

            {open && suggestions.length > 0 ? (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[#e8e4db] bg-white shadow-xl">
                    {suggestions.map((suggestion, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <button
                                key={suggestion.userId}
                                type="button"
                                onClick={() => applySuggestion(suggestion)}
                                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                                    isActive ? "bg-[#faf5eb] text-[#2d2926]" : "bg-white text-[#5c544d] hover:bg-[#fcfbf9]"
                                }`}
                            >
                                <span className="font-semibold">{suggestion.displayName}</span>
                                <span className="text-xs text-[#9a8f83]">{suggestion.email}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
