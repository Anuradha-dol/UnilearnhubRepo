import React, { useEffect, useRef, useState } from "react";
import {
    createPostCollection,
    fetchPostCollections,
    savePostToCollection,
    unsavePost,
} from "./savedPostsApi";

export default function SavePostControl({ postId, isSaved = false, onChanged }) {
    const [open, setOpen] = useState(false);
    const [collections, setCollections] = useState([]);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        const loadCollections = async () => {
            try {
                const data = await fetchPostCollections();
                if (!cancelled) {
                    setCollections(data);
                }
            } catch (error) {
                if (!cancelled) {
                    console.warn("Failed to load collections", error);
                }
            }
        };

        loadCollections();
        return () => {
            cancelled = true;
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleOutsideClick = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [open]);

    const notifyChanged = async () => {
        if (typeof onChanged === "function") {
            await onChanged();
        }
    };

    const handleSaveToExisting = async (collectionId) => {
        try {
            setLoading(true);
            await savePostToCollection(postId, { collectionId });
            await notifyChanged();
            setOpen(false);
        } catch (error) {
            console.error("Failed to save post", error);
            alert(error?.response?.data?.message || "Failed to save post");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAndSave = async () => {
        const trimmedName = newCollectionName.trim();
        if (!trimmedName) {
            return;
        }

        try {
            setLoading(true);
            const created = await createPostCollection(trimmedName);
            await savePostToCollection(postId, { collectionId: created.collectionId });
            setNewCollectionName("");
            await notifyChanged();
            setOpen(false);
        } catch (error) {
            console.error("Failed to create collection", error);
            alert(error?.response?.data?.message || "Failed to create collection");
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async () => {
        try {
            setLoading(true);
            await unsavePost(postId);
            await notifyChanged();
            setOpen(false);
        } catch (error) {
            console.error("Failed to unsave post", error);
            alert(error?.response?.data?.message || "Failed to unsave post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                className={`chip-btn chip-btn-compact ${isSaved ? "bg-[#efe6d8] text-[#6f552e]" : ""}`}
                onClick={() => setOpen((prev) => !prev)}
            >
                {isSaved ? "Saved" : "Save"}
            </button>

            {open ? (
                <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-[#e8e4db] bg-[linear-gradient(155deg,rgba(255,255,255,0.97),rgba(249,241,228,0.95))] p-3 shadow-xl">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#827a71]">Save to Collection</p>

                    {isSaved ? (
                        <button
                            type="button"
                            className="mb-3 w-full rounded-xl border border-[#e3d6c2] bg-[#faf5eb] px-3 py-2 text-sm font-semibold text-[#876d47] transition hover:bg-[#f3eadb]"
                            onClick={handleUnsave}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Unsave Post"}
                        </button>
                    ) : null}

                    <div className="mb-3 max-h-40 overflow-y-auto rounded-xl border border-[#eee5d7] bg-white/70 p-2">
                        {collections.length === 0 ? (
                            <p className="px-2 py-2 text-xs text-[#9a8f83]">No collections yet</p>
                        ) : (
                            collections.map((collection) => (
                                <button
                                    key={collection.collectionId}
                                    type="button"
                                    onClick={() => handleSaveToExisting(collection.collectionId)}
                                    disabled={loading}
                                    className="mb-1 w-full rounded-lg px-2 py-2 text-left text-sm font-medium text-[#4b443e] transition hover:bg-[#faf5eb]"
                                >
                                    {collection.name}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCollectionName}
                            onChange={(event) => setNewCollectionName(event.target.value)}
                            placeholder="New collection"
                            className="flex-1 rounded-xl border border-[#e2d8c7] bg-white px-3 py-2 text-sm text-[#2d2926] outline-none focus:border-[#b49060] focus:ring-2 focus:ring-[#b49060]/15"
                        />
                        <button
                            type="button"
                            onClick={handleCreateAndSave}
                            disabled={loading || !newCollectionName.trim()}
                            className="rounded-xl bg-[#876d47] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#765d3b] disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
