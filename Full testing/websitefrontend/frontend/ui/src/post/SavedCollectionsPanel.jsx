import React from "react";

export default function SavedCollectionsPanel({
                                                  savedMode,
                                                  collections,
                                                  activeCollectionId,
                                                  activeHashtag,
                                                  onToggleSavedMode,
                                                  onSelectCollection,
                                                  onClearHashtag,
                                              }) {
    return (
        <div className="space-y-3 rounded-2xl border border-[#e8e4db] bg-[linear-gradient(155deg,rgba(255,255,255,0.85),rgba(249,241,228,0.85))] p-3">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    className={`chip-btn chip-btn-compact ${!savedMode ? "bg-[#efe6d8] text-[#6f552e]" : ""}`}
                    onClick={() => onToggleSavedMode(false)}
                >
                    All Posts
                </button>
                <button
                    type="button"
                    className={`chip-btn chip-btn-compact ${savedMode ? "bg-[#efe6d8] text-[#6f552e]" : ""}`}
                    onClick={() => onToggleSavedMode(true)}
                >
                    Saved Posts
                </button>
            </div>

            {savedMode ? (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            activeCollectionId == null
                                ? "border-[#b49060] bg-[#f3eadb] text-[#7a623f]"
                                : "border-[#e8e4db] bg-white text-[#7f7469] hover:bg-[#faf5eb]"
                        }`}
                        onClick={() => onSelectCollection(null)}
                    >
                        All Collections
                    </button>
                    {collections.map((collection) => (
                        <button
                            key={collection.collectionId}
                            type="button"
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                activeCollectionId === collection.collectionId
                                    ? "border-[#b49060] bg-[#f3eadb] text-[#7a623f]"
                                    : "border-[#e8e4db] bg-white text-[#7f7469] hover:bg-[#faf5eb]"
                            }`}
                            onClick={() => onSelectCollection(collection.collectionId)}
                        >
                            {collection.name} ({collection.postCount})
                        </button>
                    ))}
                </div>
            ) : null}

            {activeHashtag ? (
                <div className="flex items-center gap-2 rounded-xl border border-[#eadfcd] bg-[#fcf8f0] px-3 py-2 text-xs">
                    <span className="font-semibold text-[#7a623f]">Hashtag filter:</span>
                    <span className="font-bold text-[#876d47]">#{activeHashtag}</span>
                    <button
                        type="button"
                        className="ml-auto rounded-full border border-[#decfb8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#876d47] transition hover:bg-[#faf5eb]"
                        onClick={onClearHashtag}
                    >
                        Clear
                    </button>
                </div>
            ) : null}
        </div>
    );
}
