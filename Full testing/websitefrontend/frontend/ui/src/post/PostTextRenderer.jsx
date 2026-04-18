import React from "react";

const TOKEN_REGEX = /(#[A-Za-z][A-Za-z0-9_-]{0,49}|@[A-Za-z][A-Za-z0-9._-]*(?:\s+[A-Za-z][A-Za-z0-9._-]*)?)/g;

export default function PostTextRenderer({ text, onHashtagClick }) {
    const safeText = String(text || "");
    const lines = safeText.split("\n");

    const renderLine = (line, lineIndex) => {
        const nodes = [];
        let lastIndex = 0;
        let match;
        const tokenRegex = new RegExp(TOKEN_REGEX);

        while ((match = tokenRegex.exec(line)) !== null) {
            const token = match[0];
            const start = match.index;
            const end = start + token.length;

            if (start > lastIndex) {
                nodes.push(
                    <React.Fragment key={`text-${lineIndex}-${lastIndex}`}>{line.slice(lastIndex, start)}</React.Fragment>
                );
            }

            if (token.startsWith("#")) {
                nodes.push(
                    <button
                        type="button"
                        key={`tag-${lineIndex}-${start}`}
                        className="font-semibold text-[#876d47] hover:text-[#b49060] underline-offset-2 hover:underline"
                        onClick={() => {
                            if (typeof onHashtagClick === "function") {
                                onHashtagClick(token);
                            }
                        }}
                    >
                        {token}
                    </button>
                );
            } else {
                nodes.push(
                    <span
                        key={`mention-${lineIndex}-${start}`}
                        className="font-semibold text-[#5f6f8f]"
                        title="Mention"
                    >
            {token}
          </span>
                );
            }

            lastIndex = end;
        }

        if (lastIndex < line.length) {
            nodes.push(
                <React.Fragment key={`tail-${lineIndex}-${lastIndex}`}>{line.slice(lastIndex)}</React.Fragment>
            );
        }

        if (nodes.length === 0) {
            return <React.Fragment key={`empty-${lineIndex}`}> </React.Fragment>;
        }

        return nodes;
    };

    return (
        <span className="whitespace-pre-wrap text-sm leading-relaxed text-[#3f3a36]">
      {lines.map((line, index) => (
          <React.Fragment key={`line-${index}`}>
              {renderLine(line, index)}
              {index < lines.length - 1 ? <br /> : null}
          </React.Fragment>
      ))}
    </span>
    );
}
