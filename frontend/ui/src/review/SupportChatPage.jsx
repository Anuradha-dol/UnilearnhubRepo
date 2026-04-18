import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import "../pages/Home.css";
import "./SupportChatPage.css";

const EMPTY_BOOTSTRAP = {
  currentUser: null,
  supportConversations: [],
  directConversations: [],
  contacts: [],
  adminContacts: [],
};

const NAV_ITEMS = {
  admin: [
    { label: "Profile", path: "/profile" },
    { label: "Support", path: "/SupportAdmin" },
    { label: "Resources", path: "/resources-management" },
    { label: "Admin Tasks", path: "/admin-task-manager" },
  ],
  user: [
    { label: "Profile", path: "/profile" },
    { label: "Resources", path: "/resources" },
    { label: "Support", path: "/SupportUser" },
    { label: "Review", path: "/Review" },
    { label: "Tasks", path: "/taskPage" },
  ],
};

// Keep the user and admin page text in one place.
const PAGE_COPY = {
  admin: {
    brandTitle: "Uni Learn Hub Admin",
    brandSubtitle: "Support Control Center",
    heroTitle: "Uni Learn Hub Real-Time Chat Messenger",
    heroDescription: "Manage support requests and user chats here. This is the Uni Learn Hub real-time chat messenger.",
    backPath: "/dashboard",
    backLabel: "Back to Dashboard",
    supportTitle: "Support Inbox",
    supportDescription: "Every support thread is private to the user and the admins.",
    contactDescription: "Open a direct private chat with any user or admin.",
  },
  user: {
    brandTitle: "Uni Learn Hub",
    brandSubtitle: "Support Space",
    heroTitle: "Uni Learn Hub Real-Time Chat Messenger",
    heroDescription: "Ask for support or chat with other users here. This is the Uni Learn Hub real-time chat messenger.",
    backPath: "/home",
    backLabel: "Back to Home",
    supportTitle: "Support Channel",
    supportDescription: "Your support chat is visible only to you and the admin team.",
    contactDescription: "Chat privately with users, or pick an admin from the separate admin list.",
  },
};

const PANEL_CLASS = "support-surface-card support-panel-shell premium-glass rounded-[2rem] p-4 flex flex-col gap-5 overflow-hidden";
const EMPTY_BOX_CLASS = "support-empty-box rounded-[1.5rem] border border-dashed border-[#d8d1c6] bg-white/50 text-center text-sm text-[#827a71]";
const CONTACT_OPENING_CLASS = "support-contact-opening absolute inset-0 rounded-[1.4rem] bg-white/70 backdrop-blur-[1px] flex items-center justify-center text-xs font-bold text-[#876d47]";
const SUPPORT_UNREAD_STORAGE_KEY = "supportUnreadByConversation";
const SUPPORT_LAST_SEEN_STORAGE_KEY = "supportLastSeenMessageByConversation";

function readStorageMap(key) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value || {}));
  } catch {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function getLatestMessageId(conversation) {
  return (conversation?.messages || []).reduce((latestId, message) => {
    const messageId = Number(message?.id) || 0;
    return messageId > latestId ? messageId : latestId;
  }, 0);
}

function markConversationAsSeenInStorage(conversation) {
  if (!conversation?.id) {
    return;
  }

  const conversationId = String(conversation.id);
  const latestMessageId = getLatestMessageId(conversation);
  const lastSeenByConversation = readStorageMap(SUPPORT_LAST_SEEN_STORAGE_KEY);

  if ((Number(lastSeenByConversation[conversationId]) || 0) >= latestMessageId) {
    return;
  }

  writeStorageMap(SUPPORT_LAST_SEEN_STORAGE_KEY, {
    ...lastSeenByConversation,
    [conversationId]: latestMessageId,
  });
}

function emitUnreadUpdate(unreadByConversation) {
  if (typeof window === "undefined") {
    return;
  }

  const total = Object.values(unreadByConversation || {}).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0,
  );

  window.dispatchEvent(new CustomEvent("support-unread-updated", {
    detail: { total, unreadByConversation },
  }));
}

// Sort messages so each chat always renders from old to new.
function normalizeConversation(conversation) {
  const messages = [...(conversation.messages || [])].sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return (left.id || 0) - (right.id || 0);
  });

  return { ...conversation, messages };
}

function sortConversations(conversations) {
  return [...conversations].sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function getConversationActivityTime(conversation) {
  const conversationTime = new Date(conversation?.updatedAt || conversation?.createdAt || 0).getTime();
  const lastMessage = conversation?.messages?.[conversation.messages.length - 1];
  const messageTime = new Date(lastMessage?.updatedAt || lastMessage?.createdAt || 0).getTime();
  return Math.max(conversationTime, messageTime);
}

function shouldReplaceConversation(current, incoming) {
  const currentTime = getConversationActivityTime(current);
  const incomingTime = getConversationActivityTime(incoming);

  if (incomingTime !== currentTime) {
    return incomingTime > currentTime;
  }

  const currentMessageCount = current.messages?.length || 0;
  const incomingMessageCount = incoming.messages?.length || 0;

  if (incomingMessageCount !== currentMessageCount) {
    return incomingMessageCount > currentMessageCount;
  }

  const currentLastMessageId = current.messages?.[currentMessageCount - 1]?.id || 0;
  const incomingLastMessageId = incoming.messages?.[incomingMessageCount - 1]?.id || 0;
  return incomingLastMessageId >= currentLastMessageId;
}

function upsertConversation(list, conversation) {
  const normalized = normalizeConversation(conversation);
  const nextList = list.some((item) => item.id === normalized.id)
    ? list.map((item) => (item.id === normalized.id
      ? (shouldReplaceConversation(item, normalized) ? normalized : item)
      : item))
    : [normalized, ...list];

  return sortConversations(nextList);
}

function mergeConversationLists(currentList, incomingList) {
  return incomingList.reduce((merged, conversation) => upsertConversation(merged, conversation), currentList);
}

function buildAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = api.defaults.baseURL || window.location.origin;
  return `${baseUrl}${path}`;
}

function formatClock(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStamp(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(size) {
  if (!size && size !== 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusStyle(status) {
  switch ((status || "ACTIVE").toUpperCase()) {
    case "OPEN":
      return "bg-[#fff3dc] text-[#9a6d2d] border-[#ecd6aa]";
    case "ANSWERED":
      return "bg-[#eaf4ea] text-[#50735b] border-[#c9dfcb]";
    default:
      return "bg-[#f3efe7] text-[#6f675e] border-[#dad1c4]";
  }
}

function getPreview(conversation) {
  const last = conversation.messages?.[conversation.messages.length - 1];

  if (!last) {
    return conversation.supportConversation ? "Start your support chat" : "No messages yet";
  }

  if (last.content) {
    return last.content;
  }

  switch (last.attachment?.kind) {
    case "IMAGE":
      return "Image attachment";
    case "VIDEO":
      return "Video attachment";
    case "PDF":
      return "PDF attachment";
    default:
      return "Attachment";
  }
}

function getAvatarLabel(conversation) {
  const base = conversation.partner?.name || conversation.title || "C";
  return base.charAt(0).toUpperCase();
}

function getAvatarImage(conversation) {
  return conversation.partner?.imageUrl ? buildAssetUrl(conversation.partner.imageUrl) : "";
}

function getContactName(contact) {
  if (!contact) {
    return "Unknown User";
  }

  const combinedName = [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
  return combinedName || contact.name || "Unknown User";
}

function getContactInitial(contact) {
  const base = contact?.firstName || contact?.name || "U";
  return base.charAt(0).toUpperCase();
}

function filterContacts(list, search) {
  if (!search) {
    return list;
  }

  return list.filter((contact) => {
    const firstName = (contact.firstName || "").toLowerCase();
    const fallbackName = (contact.name || "").toLowerCase();
    return firstName.includes(search) || (!firstName && fallbackName.includes(search));
  });
}

function isAllowedAttachment(file) {
  if (!file) {
    return true;
  }

  return (
    file.type.startsWith("image/") ||
    file.type.startsWith("video/") ||
    file.type === "application/pdf"
  );
}

// Small UI pieces stay up here so the main page is easier to read.
function ChatIcon({ className = "w-8 h-8", strokeWidth = 1.8 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-3 3-3-3z" />
    </svg>
  );
}

function PaperclipIcon({ className = "w-4 h-4", strokeWidth = 1.8 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}

function DocumentIcon({ className = "w-5 h-5", strokeWidth = 1.8 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M7 8h10M7 12h10m-7 4h7M7 4h6l4 4v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  );
}

function AlertIcon({ className = "w-5 h-5", strokeWidth = 2 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function Avatar({ imageUrl, alt, fallback, className }) {
  return (
    <div className={className}>
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );
}

function SectionIntro({ label, description }) {
  return (
    <div className="support-section-intro px-2">
      <div className="text-[11px] font-bold tracking-[0.24em] uppercase text-[#827a71] mb-2">
        {label}
      </div>
      <p className="text-sm text-[#5c544d]">{description}</p>
    </div>
  );
}

function EmptyBox({ className = `${EMPTY_BOX_CLASS} px-5 py-8`, children }) {
  return <div className={className}>{children}</div>;
}

function EmptyChat({ onStartSupport, isAdmin }) {
  return (
    <div className="support-empty-chat h-full flex items-center justify-center p-8">
      <div className="support-surface-card max-w-lg w-full text-center premium-glass rounded-[2rem] px-8 py-12">
        <div className="mx-auto w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-[#b49060] to-[#876d47] text-white flex items-center justify-center shadow-[0_20px_40px_rgba(180,144,96,0.25)] mb-6">
          <ChatIcon className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-[#2d2926]">
          {isAdmin ? "Select a private conversation" : "Your private chats live here"}
        </h3>
        <p className="text-[#827a71] mt-3 leading-relaxed">
          {isAdmin
            ? "Open a support thread or a direct message to answer in real time."
            : "Talk to the support team or start a direct user chat. Only the participants can see each conversation."}
        </p>
        {!isAdmin && (
          <button
            type="button"
            onClick={onStartSupport}
            className="mt-6 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_10px_24px_rgba(180,144,96,0.28)]"
          >
            Open Support Chat
          </button>
        )}
      </div>
    </div>
  );
}

function ContactButton({ contact, onClick }) {
  const contactName = getContactName(contact);
  const imageUrl = contact.imageUrl ? buildAssetUrl(contact.imageUrl) : "";

  return (
    <button
      type="button"
      onClick={() => onClick(contact)}
      className="support-contact-btn w-full flex items-center gap-3 rounded-[1.4rem] border border-[#e8e4db] bg-white/75 px-4 py-3 text-left hover:border-[#b49060]/45 transition-colors"
    >
      <Avatar
        imageUrl={imageUrl}
        alt={contactName}
        fallback={getContactInitial(contact)}
        className="support-avatar-chip w-11 h-11 rounded-[1rem] overflow-hidden bg-gradient-to-br from-[#b49060] to-[#876d47] text-white flex items-center justify-center font-bold flex-shrink-0"
      />
      <div className="min-w-0">
        <div className="font-semibold text-[#2d2926] truncate">{contactName}</div>
        <div className="text-xs text-[#6f675e] truncate">
          {contact.lastName ? `Last name: ${contact.lastName}` : contact.email}
        </div>
        <div className="text-xs text-[#827a71] truncate">{contact.phoneNumber || contact.email}</div>
      </div>
    </button>
  );
}

function ContactDetailChip({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <span className="px-3 py-1 rounded-full bg-[#f7f2ea] text-[#6f675e] border border-[#e6dccd] text-[11px] font-semibold">
      {label}: {value}
    </span>
  );
}

function ConversationButton({
  conversation,
  active,
  onClick,
  showSupportBadge,
  unreadCount = 0,
}) {
  const imageUrl = getAvatarImage(conversation);
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`support-conversation-btn w-full text-left rounded-[1.6rem] border px-4 py-4 transition-all ${
        active
          ? "support-conversation-active bg-[#2d2926] text-white border-[#2d2926] shadow-[0_18px_30px_rgba(45,41,38,0.18)]"
          : "support-conversation-inactive bg-white/75 text-[#2d2926] border-[#e8e4db] hover:border-[#b49060]/45"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar
          imageUrl={imageUrl}
          alt={conversation.title}
          fallback={getAvatarLabel(conversation)}
          className="support-avatar-chip w-12 h-12 rounded-[1rem] overflow-hidden bg-gradient-to-br from-[#b49060] to-[#876d47] text-white flex items-center justify-center font-bold flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="font-bold truncate">{conversation.title}</div>
            <div className="flex items-center gap-2">
              <div className={`text-[11px] font-semibold ${active ? "text-white/70" : "text-[#827a71]"}`}>
                {formatClock(lastMessage?.createdAt || conversation.updatedAt)}
              </div>
              {unreadCount > 0 && (
                <span className="support-unread-pill inline-flex flex-shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[#c9a46b] bg-[#f6e7cf] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] leading-none text-[#6d4a2b] shadow-sm">
                  NEW {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
          </div>
          <div className={`mt-1 text-xs truncate ${active ? "text-white/75" : "text-[#827a71]"}`}>
            {getPreview(conversation)}
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {showSupportBadge ? (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border ${active ? "border-white/20 bg-white/10 text-white" : getStatusStyle(conversation.status)}`}>
                {conversation.status}
              </span>
            ) : (
              conversation.partner?.role && (
                <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${active ? "text-white/65" : "text-[#876d47]"}`}>
                  {conversation.partner.role}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function AttachmentPreview({ attachment }) {
  if (!attachment?.url) {
    return null;
  }

  const assetUrl = buildAssetUrl(attachment.url);

  if (attachment.kind === "IMAGE") {
    return (
      <a href={assetUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
        <img src={assetUrl} alt={attachment.name || "Attachment"} className="w-full max-h-80 object-cover rounded-2xl" />
      </a>
    );
  }

  if (attachment.kind === "VIDEO") {
    return (
      <video className="w-full max-h-80 rounded-2xl bg-black" controls preload="metadata">
        <source src={assetUrl} type={attachment.contentType || "video/mp4"} />
        Your browser does not support this video.
      </video>
    );
  }

  return (
    <a
      href={assetUrl}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl bg-black/10 px-4 py-3"
    >
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <DocumentIcon />
      </div>
      <div className="min-w-0">
        <div className="font-semibold truncate">{attachment.name || "PDF document"}</div>
        <div className="text-xs opacity-70">{formatFileSize(attachment.size)}</div>
      </div>
    </a>
  );
}

function MessageBubble({
  message,
  onEdit,
  onDelete,
  isEditing,
  editingText,
  setEditingText,
  onSaveEdit,
  onCancelEdit,
}) {
  const mine = message.mine;
  const wrapperClass = mine ? "justify-end" : "justify-start";
  const contentClass = mine ? "items-end" : "items-start";
  const senderClass = mine ? "text-[#876d47]" : "text-[#827a71]";
  const bubbleClass = mine
    ? "bg-gradient-to-br from-[#b49060] to-[#876d47] text-white rounded-br-md"
    : "bg-white border border-[#e8e4db] text-[#4f4841] rounded-bl-md";

  return (
    <div className={`support-message-row flex ${wrapperClass}`}>
      <div className={`support-message-stack max-w-[92%] sm:max-w-[78%] ${contentClass} flex flex-col gap-2 group`}>
        <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${senderClass}`}>
          {mine ? "You" : message.senderName}
        </div>

        <div className={`support-message-bubble rounded-[1.8rem] px-4 py-3 shadow-sm ${bubbleClass}`}>
          {isEditing ? (
            <div className="flex flex-col gap-3 min-w-[260px]">
              <textarea
                value={editingText}
                onChange={(event) => setEditingText(event.target.value)}
                className={`w-full min-h-[100px] rounded-2xl px-3 py-2 text-sm resize-none outline-none ${mine ? "bg-white/15 placeholder-white/70" : "bg-[#faf8f3]"}`}
                placeholder="Edit your message"
              />
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={onCancelEdit} className={`px-4 py-2 rounded-full text-xs font-bold ${mine ? "bg-white/15" : "bg-[#f3efe7]"}`}>
                  Cancel
                </button>
                <button type="button" onClick={onSaveEdit} className={`px-4 py-2 rounded-full text-xs font-bold ${mine ? "bg-white text-[#876d47]" : "bg-[#2d2926] text-white"}`}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {message.content && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>}
              <AttachmentPreview attachment={message.attachment} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-[11px] font-medium text-[#827a71]">
            {formatStamp(message.createdAt)}
            {message.edited ? " (edited)" : ""}
          </span>
          {!isEditing && message.editable && (
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-bold uppercase tracking-wider text-[#876d47] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Edit
            </button>
          )}
          {!isEditing && message.deletable && (
            <button
              type="button"
              onClick={onDelete}
              className="text-[11px] font-bold uppercase tracking-wider text-[#c36254] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactGroup({ title, contacts, emptyText, startingContactId, onContactClick }) {
  return (
    <div className="support-contact-group">
      <div className="px-2 mb-3 text-[11px] font-bold tracking-[0.22em] uppercase text-[#827a71]">
        {title}
      </div>
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <EmptyBox className={`${EMPTY_BOX_CLASS} px-5 py-6`}>{emptyText}</EmptyBox>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="relative">
              <ContactButton contact={contact} onClick={onContactClick} />
              {startingContactId === contact.id && (
                <div className={CONTACT_OPENING_CLASS}>Opening...</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SelectedFileCard({ file, onRemove }) {
  if (!file) {
    return null;
  }

  return (
    <div className="support-selected-file inline-flex items-center gap-3 rounded-2xl border border-[#e8e4db] bg-white px-4 py-3 shadow-sm w-fit max-w-full">
      <div className="w-10 h-10 rounded-xl bg-[#faf5eb] text-[#876d47] flex items-center justify-center flex-shrink-0">
        <PaperclipIcon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm text-[#2d2926] truncate">{file.name}</div>
        <div className="text-xs text-[#827a71]">{formatFileSize(file.size)}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-xs font-bold uppercase tracking-wider text-[#c36254]"
      >
        Remove
      </button>
    </div>
  );
}

function buildIncomingBootstrap(data) {
  return {
    currentUser: data.currentUser,
    supportConversations: sortConversations((data.supportConversations || []).map(normalizeConversation)),
    directConversations: sortConversations((data.directConversations || []).map(normalizeConversation)),
    contacts: data.contacts || [],
    adminContacts: data.adminContacts || [],
  };
}

function getDefaultConversationId(nextBootstrap, currentId, isAdmin) {
  const availableConversations = [...nextBootstrap.supportConversations, ...nextBootstrap.directConversations];

  if (currentId && availableConversations.some((conversation) => conversation.id === currentId)) {
    return currentId;
  }

  if (!isAdmin && nextBootstrap.supportConversations[0]) {
    return nextBootstrap.supportConversations[0].id;
  }

  return nextBootstrap.supportConversations[0]?.id
    || nextBootstrap.directConversations[0]?.id
    || null;
}

function getConversationById(bootstrap, conversationId) {
  if (!bootstrap || conversationId === null || conversationId === undefined) {
    return null;
  }

  const conversations = [
    ...(bootstrap.supportConversations || []),
    ...(bootstrap.directConversations || []),
  ];

  return conversations.find((conversation) => String(conversation.id) === String(conversationId)) || null;
}

function countUnreadMessages(previousConversation, incomingConversation) {
  const incomingMessages = incomingConversation?.messages || [];

  if (incomingMessages.length === 0) {
    return 0;
  }

  const previousIds = new Set((previousConversation?.messages || []).map((message) => message.id));

  return incomingMessages.reduce((total, message) => {
    if (previousIds.has(message.id)) {
      return total;
    }

    return message.mine ? total : total + 1;
  }, 0);
}

export default function SupportChatPage({ mode }) {
  const navigate = useNavigate();
  const isAdmin = mode === "admin";
  const pageCopy = PAGE_COPY[isAdmin ? "admin" : "user"];
  const navItems = NAV_ITEMS[isAdmin ? "admin" : "user"];
  const attachmentInputId = `chat-attachment-${mode}`;

  const wsRef = useRef(null);
  const bootstrapRef = useRef(EMPTY_BOOTSTRAP);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const fileInputRef = useRef(null);
  const messagesViewportRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const initializedRef = useRef(false);

  const [bootstrap, setBootstrap] = useState(EMPTY_BOOTSTRAP);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [unreadByConversation, setUnreadByConversation] = useState(() => readStorageMap(SUPPORT_UNREAD_STORAGE_KEY));
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [startingContactId, setStartingContactId] = useState(null);
  const [contactSearch, setContactSearch] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState("");

  const deferredContactSearch = useDeferredValue(contactSearch.trim());
  const normalizedContactSearch = deferredContactSearch.toLowerCase();

  const supportConversations = bootstrap.supportConversations || [];
  const directConversations = bootstrap.directConversations || [];
  const contacts = bootstrap.contacts || [];
  const adminContacts = bootstrap.adminContacts || [];
  const visibleContacts = filterContacts(contacts, normalizedContactSearch);
  const visibleAdminContacts = filterContacts(adminContacts, normalizedContactSearch);
  const totalAvailableContacts = contacts.length + adminContacts.length;
  const allConversations = [...supportConversations, ...directConversations];
  const activeConversation = allConversations.find((conversation) => conversation.id === activeConversationId) || null;
  const userSupportConversation = !isAdmin ? supportConversations[0] || null : null;
  const activeConversationAvatar = activeConversation ? getAvatarImage(activeConversation) : "";

  function clearUnreadForConversation(conversationId) {
    if (conversationId === null || conversationId === undefined) {
      return;
    }

    const conversation = getConversationById(bootstrapRef.current, conversationId);

    if (conversation) {
      markConversationAsSeenInStorage(conversation);
    }

    const key = String(conversationId);

    setUnreadByConversation((previous) => {
      if (!previous[key]) {
        return previous;
      }

      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  function increaseUnreadForConversation(conversationId, amount) {
    if (conversationId === null || conversationId === undefined || amount <= 0) {
      return;
    }

    const key = String(conversationId);

    setUnreadByConversation((previous) => ({
      ...previous,
      [key]: (previous[key] || 0) + amount,
    }));
  }

  function syncUnreadFromBootstrap(previousBootstrap, nextBootstrap, activeId) {
    const nextConversations = [
      ...(nextBootstrap.supportConversations || []),
      ...(nextBootstrap.directConversations || []),
    ];
    const previousConversations = [
      ...(previousBootstrap.supportConversations || []),
      ...(previousBootstrap.directConversations || []),
    ];
    const previousById = new Map(previousConversations.map((conversation) => [String(conversation.id), conversation]));
    const activeKey = activeId === null || activeId === undefined ? null : String(activeId);
    const unreadDeltasById = {};

    nextConversations.forEach((conversation) => {
      const conversationKey = String(conversation.id);

      if (activeKey && conversationKey === activeKey) {
        return;
      }

      const previousConversation = previousById.get(conversationKey);
      const unreadDelta = countUnreadMessages(previousConversation, conversation);

      if (unreadDelta > 0) {
        unreadDeltasById[conversationKey] = unreadDelta;
      }
    });

    setUnreadByConversation((previousUnread) => {
      const allowedIds = new Set(nextConversations.map((conversation) => String(conversation.id)));
      const nextUnread = {};

      Object.entries(previousUnread).forEach(([conversationId, count]) => {
        if (allowedIds.has(conversationId) && conversationId !== activeKey) {
          nextUnread[conversationId] = count;
        }
      });

      Object.entries(unreadDeltasById).forEach(([conversationId, count]) => {
        nextUnread[conversationId] = (nextUnread[conversationId] || 0) + count;
      });

      return nextUnread;
    });
  }

  function openConversation(conversationId) {
    setActiveConversationId(conversationId);
    clearUnreadForConversation(conversationId);
  }

  // Load the first chat data when this page opens.
  useEffect(() => {
    shouldReconnectRef.current = true;
    let cancelled = false;

    async function initializeChat() {
      await loadBootstrap();
      if (!cancelled) {
        openSocket();
      }
    }

    initializeChat();

    return () => {
      cancelled = true;
      shouldReconnectRef.current = false;

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      setSocketConnected(false);
    };
  }, []);

  // Keep the latest message visible inside the chat box.
  useEffect(() => {
    const viewport = messagesViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }, [activeConversationId, activeConversation?.messages?.length]);

  // If the socket is down, keep refreshing so the chat still updates.
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
    clearUnreadForConversation(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    bootstrapRef.current = bootstrap;
  }, [bootstrap]);

  useEffect(() => {
    writeStorageMap(SUPPORT_UNREAD_STORAGE_KEY, unreadByConversation);
    emitUnreadUpdate(unreadByConversation);
  }, [unreadByConversation]);

  useEffect(() => {
    if (loading || socketConnected) {
      return undefined;
    }

    const refreshInterval = window.setInterval(() => {
      loadBootstrap();
    }, 2500);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loading, socketConnected]);

  async function loadBootstrap(forceReplace = false) {
    try {
      const response = await api.get("/support/bootstrap", { withCredentials: true });
      const incomingBootstrap = buildIncomingBootstrap(response.data);
      const previousBootstrap = bootstrapRef.current;
      const nextBootstrap = forceReplace
        ? incomingBootstrap
        : {
          currentUser: incomingBootstrap.currentUser,
          supportConversations: mergeConversationLists(previousBootstrap.supportConversations || [], incomingBootstrap.supportConversations),
          directConversations: mergeConversationLists(previousBootstrap.directConversations || [], incomingBootstrap.directConversations),
          contacts: incomingBootstrap.contacts,
          adminContacts: incomingBootstrap.adminContacts,
        };
      const activeId = activeConversationIdRef.current;

      if (initializedRef.current) {
        syncUnreadFromBootstrap(previousBootstrap, nextBootstrap, activeId);
      } else {
        initializedRef.current = true;
        setUnreadByConversation(readStorageMap(SUPPORT_UNREAD_STORAGE_KEY));
      }

      bootstrapRef.current = nextBootstrap;
      setBootstrap(nextBootstrap);
      setActiveConversationId((current) => getDefaultConversationId(nextBootstrap, current, isAdmin));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load chat data");
    } finally {
      setLoading(false);
    }
  }

  function openSocket() {
    if (!shouldReconnectRef.current) {
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const baseUrl = api.defaults.baseURL || window.location.origin;
      const token = window.localStorage.getItem("token");
      const wsUrl = token
        ? `${baseUrl.replace(/^http/, "ws")}/ws/support?accessToken=${encodeURIComponent(token)}`
        : `${baseUrl.replace(/^http/, "ws")}/ws/support`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setSocketConnected(true);
        setError("");
        reconnectAttemptsRef.current = 0;

        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        loadBootstrap();
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "CONVERSATION_UPDATED" && payload.conversation) {
            const normalizedConversation = normalizeConversation(payload.conversation);
            const previousConversation = getConversationById(bootstrapRef.current, normalizedConversation.id);
            const activeId = activeConversationIdRef.current;

            replaceConversation(normalizedConversation);

            if (!activeId) {
              openConversation(normalizedConversation.id);
            } else if (String(activeId) === String(normalizedConversation.id)) {
              markConversationAsSeenInStorage(normalizedConversation);
              clearUnreadForConversation(normalizedConversation.id);
            } else {
              const unreadDelta = countUnreadMessages(previousConversation, normalizedConversation);

              if (unreadDelta > 0) {
                increaseUnreadForConversation(normalizedConversation.id, unreadDelta);
              }
            }

            return;
          }

          if (payload.type === "MESSAGE_DELETED") {
            // Delete is safer to refresh from the server because the chat size becomes smaller.
            loadBootstrap(true);
            return;
          }

          if (payload.type === "ERROR" && payload.message) {
            setError(payload.message);
          }
        } catch (parseError) {
          console.error("Invalid chat websocket payload", parseError);
        }
      };

      socket.onerror = () => {
        setSocketConnected(false);
        socket.close();
      };

      socket.onclose = () => {
        setSocketConnected(false);

        if (wsRef.current === socket) {
          wsRef.current = null;
        }

        scheduleReconnect();
      };
    } catch (connectionError) {
      console.error("Chat websocket failed", connectionError);
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (!shouldReconnectRef.current || reconnectTimeoutRef.current) {
      return;
    }

    const delay = Math.min(1000 * (2 ** reconnectAttemptsRef.current), 10000);
    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      openSocket();
    }, delay);
  }

  function mergeConversation(conversation) {
    const normalized = normalizeConversation(conversation);

    setBootstrap((previous) => {
      const targetKey = normalized.supportConversation ? "supportConversations" : "directConversations";
      return {
        ...previous,
        [targetKey]: upsertConversation(previous[targetKey], normalized),
      };
    });
  }

  function replaceConversation(conversation) {
    const normalized = normalizeConversation(conversation);

    setBootstrap((previous) => {
      const targetKey = normalized.supportConversation ? "supportConversations" : "directConversations";
      const currentList = previous[targetKey] || [];
      const nextList = currentList.some((item) => item.id === normalized.id)
        ? currentList.map((item) => (item.id === normalized.id ? normalized : item))
        : [normalized, ...currentList];

      return {
        ...previous,
        [targetKey]: sortConversations(nextList),
      };
    });
  }

  function clearSelectedFile() {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearComposer() {
    setMessageText("");
    clearSelectedFile();
  }

  function activateConversation(conversation) {
    mergeConversation(conversation);
    openConversation(conversation.id);
  }

  // Use one helper when we need to create or reopen the support room.
  async function requestSupportConversation(errorMessage) {
    try {
      const response = await api.post("/support/support-conversations", {}, { withCredentials: true });
      return normalizeConversation(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || errorMessage);
      return null;
    }
  }

  async function openSupportConversation() {
    setError("");
    const conversation = await requestSupportConversation("Failed to open support chat");

    if (conversation) {
      activateConversation(conversation);
    }
  }

  async function openDirectConversation(contact) {
    try {
      setStartingContactId(contact.id);
      setError("");
      const response = await api.post("/support/direct-conversations", { recipientId: contact.id }, { withCredentials: true });
      activateConversation(normalizeConversation(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to start direct chat");
    } finally {
      setStartingContactId(null);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isAllowedAttachment(file)) {
      setError("Only image, video, or PDF files are allowed.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setError("");
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    if (sending) {
      return;
    }

    let conversation = activeConversation;

    if (!conversation && !isAdmin) {
      if (userSupportConversation) {
        conversation = userSupportConversation;
      } else {
        conversation = await requestSupportConversation("Failed to create support chat");

        if (!conversation) {
          return;
        }

        activateConversation(conversation);
      }
    }

    if (!conversation) {
      setError("Select a conversation first.");
      return;
    }

    if (!messageText.trim() && !selectedFile) {
      return;
    }

    const formData = new FormData();

    if (messageText.trim()) {
      formData.append("content", messageText.trim());
    }

    if (selectedFile) {
      formData.append("attachment", selectedFile);
    }

    try {
      setSending(true);
      setError("");
      const response = await api.post(`/support/conversations/${conversation.id}/messages`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      mergeConversation(response.data);
      openConversation(response.data.id);
      clearComposer();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function beginEditing(message) {
    setEditingMessageId(message.id);
    setEditingText(message.content || "");
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setEditingText("");
  }

  async function saveMessageEdit() {
    if (!activeConversation || !editingMessageId || !editingText.trim()) {
      return;
    }

    try {
      const response = await api.put(
        `/support/conversations/${activeConversation.id}/messages/${editingMessageId}`,
        { content: editingText.trim() },
        { withCredentials: true },
      );
      mergeConversation(response.data);
      cancelEditing();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update message");
    }
  }

  async function deleteMessage(message) {
    if (!activeConversation || !message?.id) {
      return;
    }

    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      const response = await api.delete(`/support/conversations/${activeConversation.id}/messages/${message.id}`, {
        withCredentials: true,
      });
      replaceConversation(response.data);

      if (editingMessageId === message.id) {
        cancelEditing();
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete message");
    }
  }

  function renderConversationList(conversations, showSupportBadge) {
    return conversations.map((conversation) => (
      <ConversationButton
        key={conversation.id}
        conversation={conversation}
        active={activeConversationId === conversation.id}
        onClick={() => openConversation(conversation.id)}
        showSupportBadge={showSupportBadge}
        unreadCount={unreadByConversation[String(conversation.id)] || 0}
      />
    ));
  }

  // The support list changes a little between admin and user mode.
  function renderSupportSidebar() {
    if (isAdmin) {
      return supportConversations.length
        ? renderConversationList(supportConversations, true)
        : <EmptyBox className={`${EMPTY_BOX_CLASS} px-5 py-10`}>No support chats yet.</EmptyBox>;
    }

    if (userSupportConversation) {
      return (
        <ConversationButton
          conversation={userSupportConversation}
          active={activeConversationId === userSupportConversation.id}
          onClick={() => openConversation(userSupportConversation.id)}
          showSupportBadge
          unreadCount={unreadByConversation[String(userSupportConversation.id)] || 0}
        />
      );
    }

    return (
      <button
        type="button"
        onClick={openSupportConversation}
        className="support-start-support-btn w-full rounded-[1.6rem] border border-dashed border-[#b49060]/45 bg-white/65 px-5 py-6 text-left"
      >
        <div className="text-sm font-bold text-[#2d2926]">Start a private support chat</div>
        <div className="text-xs text-[#827a71] mt-2">
          Ask a problem, get a realtime admin reply, and keep it private.
        </div>
      </button>
    );
  }

  // Show the same contact block for users and admins.
  function renderContactGroups() {
    const contactGroups = [
      {
        title: "Users",
        contacts: visibleContacts,
        emptyText: deferredContactSearch ? "No users found for that first name." : "No users available.",
      },
      {
        title: "Admins",
        contacts: visibleAdminContacts,
        emptyText: deferredContactSearch ? "No admins found for that first name." : "No admins available.",
      },
    ];

    return contactGroups.map((group) => (
      <ContactGroup
        key={group.title}
        title={group.title}
        contacts={group.contacts}
        emptyText={group.emptyText}
        startingContactId={startingContactId}
        onContactClick={openDirectConversation}
      />
    ));
  }

  if (loading) {
    return (
      <div className="modern-home-page support-redesign flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#e8e4db] border-t-[#b49060] animate-spin" />
          <p className="text-[#827a71] font-medium tracking-wide">Loading messenger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-home-page support-redesign">
      <div className="light-bg-gradient" />
      <div className="grain-overlay" />
      <div className="color-ribbon color-ribbon-1" />
      <div className="color-ribbon color-ribbon-2" />
      <div className="color-ribbon color-ribbon-3" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      <main className="site-shell support-main-shell pt-6 pb-8 min-h-screen flex flex-col gap-5 animate-in" style={{ animationDelay: "100ms" }}>
        <header className="support-surface-card support-top-nav premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => navigate(pageCopy.backPath)}
            className="flex items-center gap-3 sm:gap-4 group text-left"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
              <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                {pageCopy.brandTitle}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest">
                {pageCopy.brandSubtitle}
              </p>
            </div>
          </button>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className="nav-pill text-xs sm:text-sm"
                onClick={() => navigate(item.path)}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <section className="support-surface-card support-hero-banner premium-glass rounded-[2rem] px-6 py-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-[1.6rem] flex items-center justify-center shadow-[0_18px_35px_rgba(45,41,38,0.18)] ${isAdmin ? "bg-gradient-to-br from-[#2d2926] to-[#5c544d] text-white" : "bg-gradient-to-br from-[#b49060] to-[#876d47] text-white"}`}>
              <ChatIcon />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#2d2926]">{pageCopy.heroTitle}</h1>
              <p className="text-[#827a71] font-medium tracking-wide mt-1">{pageCopy.heroDescription}</p>
              <div className="support-live-pill mt-3 inline-flex items-center gap-2 rounded-full border border-[#e8e4db] bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]">
                <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? "bg-[#4f9a68]" : "bg-[#c58b4d]"}`} />
                <span className={socketConnected ? "text-[#4f9a68]" : "text-[#9a6d2d]"}>
                  {socketConnected ? "Live" : "Reconnecting"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(pageCopy.backPath)}
            className="support-back-btn px-5 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:text-[#b49060] transition-colors"
          >
            {pageCopy.backLabel}
          </button>
        </section>

        {error && (
          <div className="support-error-banner p-4 rounded-2xl bg-[#fcf1ef] text-[#c36254] border border-[#f0c3be] text-sm font-bold flex items-center gap-2">
            <AlertIcon />
            {error}
          </div>
        )}

        <section className="support-workspace-grid grid grid-cols-1 xl:grid-cols-[360px_380px_minmax(0,1fr)] gap-5 min-h-[76vh]">
          <aside className={PANEL_CLASS}>
            <SectionIntro label={pageCopy.supportTitle} description={pageCopy.supportDescription} />
            <div className="space-y-3 overflow-y-auto pr-1">
              {renderSupportSidebar()}
            </div>
          </aside>

          <aside className={PANEL_CLASS}>
            <SectionIntro
              label="Direct Messages"
              description="Private one-to-one conversations. Only the two participants can see them."
            />

            <div className="space-y-3 overflow-y-auto pr-1 max-h-[38vh]">
              {directConversations.length
                ? renderConversationList(directConversations, false)
                : <EmptyBox>No direct chats yet.</EmptyBox>}
            </div>

            <div className="border-t border-[#e8e4db] pt-4 flex flex-col min-h-0">
              <div className="px-2 mb-3">
                <div className="text-[11px] font-bold tracking-[0.24em] uppercase text-[#827a71] mb-2">
                  Start New Chat
                </div>
                <p className="text-sm text-[#5c544d]">{pageCopy.contactDescription}</p>
                <div className="mt-4 relative">
                  <input
                    type="search"
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                    placeholder="Search users by first name"
                    className="support-contact-search w-full rounded-[1.2rem] border border-[#e8e4db] bg-white px-4 py-3 pr-10 text-sm text-[#2d2926] placeholder-[#9a938b] outline-none focus:border-[#b49060]/55"
                  />
                  {contactSearch && (
                    <button
                      type="button"
                      onClick={() => setContactSearch("")}
                      className="support-contact-search-clear absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wider text-[#876d47]"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93887c]">
                  <span>{deferredContactSearch ? `Results for ${deferredContactSearch}` : `${totalAvailableContacts} contacts available`}</span>
                </div>
              </div>

              <div className="space-y-5 overflow-y-auto pr-1">
                {renderContactGroups()}
              </div>
            </div>
          </aside>

          <div className="support-surface-card support-chat-shell premium-glass rounded-[2rem] overflow-hidden h-[78vh] min-h-0 flex flex-col">
            {!activeConversation ? (
              <EmptyChat onStartSupport={openSupportConversation} isAdmin={isAdmin} />
            ) : (
              <>
                <header className="support-chat-header px-6 py-5 border-b border-[#e8e4db] bg-white/70 backdrop-blur-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar
                      imageUrl={activeConversationAvatar}
                      alt={activeConversation.title}
                      fallback={getAvatarLabel(activeConversation)}
                      className="support-chat-avatar w-14 h-14 rounded-[1.2rem] overflow-hidden bg-gradient-to-br from-[#b49060] to-[#876d47] text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold text-[#2d2926] truncate">{activeConversation.title}</h2>
                      <p className="text-sm text-[#827a71] truncate">{activeConversation.subtitle}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <ContactDetailChip label="Last Name" value={activeConversation.partner?.lastName} />
                        <ContactDetailChip label="Phone" value={activeConversation.partner?.phoneNumber} />
                      </div>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] border ${activeConversation.supportConversation ? getStatusStyle(activeConversation.status) : "bg-[#f3efe7] text-[#6f675e] border-[#dad1c4]"}`}>
                    {activeConversation.supportConversation ? activeConversation.status : "Private"}
                  </span>
                </header>

                <div
                  ref={messagesViewportRef}
                  className="support-message-scroll flex-1 min-h-0 overflow-y-auto px-5 py-6 bg-[radial-gradient(circle_at_top_left,rgba(180,144,96,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,244,238,0.96))]"
                >
                  <div className="max-w-4xl mx-auto flex flex-col gap-6">
                    {activeConversation.messages.length === 0 ? (
                      <EmptyBox className={`${EMPTY_BOX_CLASS} bg-white/70 px-5 py-12`}>
                        No messages yet. Start the conversation.
                      </EmptyBox>
                    ) : (
                      activeConversation.messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          onEdit={() => beginEditing(message)}
                          onDelete={() => deleteMessage(message)}
                          isEditing={editingMessageId === message.id}
                          editingText={editingText}
                          setEditingText={setEditingText}
                          onSaveEdit={saveMessageEdit}
                          onCancelEdit={cancelEditing}
                        />
                      ))
                    )}
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="support-composer-shell border-t border-[#e8e4db] bg-white/75 px-5 py-5">
                  <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    <SelectedFileCard file={selectedFile} onRemove={clearSelectedFile} />

                    <div className="support-composer-card rounded-[1.8rem] border border-[#e8e4db] bg-white shadow-[0_18px_35px_rgba(45,41,38,0.08)] p-3">
                      <div className="flex flex-col gap-3">
                        <textarea
                          value={messageText}
                          onChange={(event) => setMessageText(event.target.value)}
                          placeholder={activeConversation.supportConversation ? "Write your support message..." : "Type a private message..."}
                          className="support-composer-textarea w-full min-h-[110px] bg-transparent px-2 py-2 text-sm text-[#2d2926] placeholder-[#a39c93] resize-none outline-none"
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <input
                              ref={fileInputRef}
                              id={attachmentInputId}
                              type="file"
                              accept="image/*,video/*,application/pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <label
                              htmlFor={attachmentInputId}
                              className="support-attach-btn inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#faf5eb] text-[#876d47] text-sm font-bold cursor-pointer"
                            >
                              <PaperclipIcon />
                              Add Image / Video / PDF
                            </label>
                            <span className="text-xs text-[#827a71]">
                              Realtime delivery. Private to conversation participants only.
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={sending || (!messageText.trim() && !selectedFile)}
                            className="support-send-btn px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2d2926] to-[#5c544d] text-white font-bold text-sm shadow-[0_10px_24px_rgba(45,41,38,0.22)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sending ? "Sending..." : "Send Message"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
