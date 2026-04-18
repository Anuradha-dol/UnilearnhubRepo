import React, { useEffect, useRef, useState } from "react";
import api from "../api";

const SUGGESTED_PROMPTS = [
    "What is Uni Learn Hub?",
    "How to learn step by step?",
    "What is deep learning?",
    "Tell me about frontend development.",
];

function createMessage(role, text) {
    return {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        text,
    };
}

export default function LandingChatbot({ compact = false, onClose = null }) {
    const [messages, setMessages] = useState(() => [
        createMessage(
            "assistant",
            "Hello. I am the Uni Learn Assistant. Ask about Uni Learn Hub, deep learning, frontend, backend, or how to learn."
        ),
    ]);
    const [draft, setDraft] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, isSending]);

    const prompts = compact ? SUGGESTED_PROMPTS.slice(0, 3) : SUGGESTED_PROMPTS;

    const sendMessage = async (rawMessage) => {
        const content = rawMessage.trim();
        if (!content || isSending) {
            return;
        }

        setMessages((currentMessages) => [...currentMessages, createMessage("user", content)]);
        setDraft("");
        setIsSending(true);

        try {
            const response = await api.post("/api/chat", { message: content });
            const reply =
                typeof response.data?.reply === "string" && response.data.reply.trim()
                    ? response.data.reply.trim()
                    : "I could not find a useful answer for that question yet.";

            setMessages((currentMessages) => [...currentMessages, createMessage("assistant", reply)]);
        } catch (error) {
            const reply =
                error.response?.data?.message ||
                "The chatbot is unavailable right now. Please try again in a moment.";

            setMessages((currentMessages) => [...currentMessages, createMessage("assistant", reply)]);
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        sendMessage(draft);
    };

    return (
        <div className={`landing-chatbot ${compact ? "landing-chatbot--compact" : ""}`}>
            <div className="landing-chatbot__header">
                <div>
                    <p className="landing-chatbot__eyebrow">
                        {compact ? "Ask the chatbot" : "Live landing page chatbot"}
                    </p>
                    <h3>Uni Learn Assistant</h3>
                </div>
                <div className="landing-chatbot__header-actions">
                    <span className="landing-chatbot__status">{isSending ? "Thinking" : "Online"}</span>
                    {onClose ? (
                        <button type="button" className="landing-chatbot__close" onClick={onClose}>
                            X
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="landing-chatbot__suggestions">
                {prompts.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        className="landing-chatbot__chip"
                        disabled={isSending}
                        onClick={() => sendMessage(prompt)}
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            <div className="landing-chatbot__messages">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`landing-chatbot__message landing-chatbot__message--${message.role}`}
                    >
            <span className="landing-chatbot__author">
              {message.role === "assistant" ? "Assistant" : "You"}
            </span>
                        <p>{message.text}</p>
                    </div>
                ))}

                {isSending ? (
                    <div className="landing-chatbot__message landing-chatbot__message--assistant landing-chatbot__message--typing">
                        <span className="landing-chatbot__author">Assistant</span>
                        <p>Working on an answer...</p>
                    </div>
                ) : null}

                <div ref={messagesEndRef} />
            </div>

            <form className="landing-chatbot__composer" onSubmit={handleSubmit}>
                <label className="landing-chatbot__input-shell" htmlFor="landing-chatbot-input">
                    <span className="landing-chatbot__sr-only">Ask the assistant</span>
                    <input
                        id="landing-chatbot-input"
                        type="text"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={compact ? "Ask here..." : "Ask a learning question..."}
                    />
                </label>
                <button type="submit" className="landing-chatbot__send" disabled={isSending || !draft.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
}
