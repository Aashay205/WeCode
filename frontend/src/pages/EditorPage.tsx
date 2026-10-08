import { useParams } from "react-router-dom"
import { useCallback, useEffect, useState, useRef, } from "react";
import type { editor } from "monaco-editor";
import Editor from "@monaco-editor/react";

import "../index.css";

import CommentPanel from "../components/CommentPanel";
import AddCommentModal from "../components/AddCommentModal"
import ConfirmModal from "../components/ConfirmModal";


import type { User } from "../types/user";
import { useRoom } from "../hooks/useRoom";
import { useComments } from "../hooks/useComments";
import useEditorSync from "../hooks/useEditorSync";
import { useCursors } from "../hooks/useCursors";



const LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
];


export default function EditorPage() {
  const userId = localStorage.getItem("userId")!;
  const { roomId } = useParams<{ roomId: string }>();
  const [input, setInput] = useState("");
  const [kickTarget, setKickTarget] = useState<User | null>(null);
  const [hostTransferTarget, setHostTransferTarget] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const usersRef = useRef<Map<string, string>>(new Map());
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState<boolean>(false);




  // HOOKS LOGIC
  const {
    users,
    hostUserId,
    isHost,
    leaveRoom,
    kickUser,
    transferHost,
    isPageLoading,
    roomError,
    hasJoinedRoom,
    retryRoomJoin,
    deleteRoom,
  } = useRoom({
    roomId: roomId!,
  });


  const getUsernameById = useCallback((id: string) => {
    return usersRef.current.get(id) ?? "User";
  }, []);


  const {
    code,
    language,
    onCodeChange,
    onLanguageChange,
    runCode,
    output,
    isRunning,
  } = useEditorSync({
    roomId: roomId!,
    isHost
  })

  const { bindEditorEvents } = useCursors({
    roomId: roomId!,
    getUsernameById,
    editorRef,
  });
  const {
    comments,
    isPanelOpen,
    setIsPanelOpen,
    isModalOpen,
    commentLine,
    openAddComment,
    submitComment,
    replyToComment,
    closeModal,
    resolveComment,
    unresolveComment,
    deleteComment
  } = useComments({
    roomId: roomId!,
    editorRef,
  })

  const jumpToLine = (lineNumber: number) => {
    if (!editorRef.current) return;

    editorRef.current.revealLineInCenter(lineNumber);
    editorRef.current.setPosition({
      lineNumber,
      column: 1,
    });
    editorRef.current.focus();
  };

  const copyInviteLink = async () => {
    if (!roomId || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      setInviteCopied(false);
    }
  };

  useEffect(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.userId, u.username));
    usersRef.current = map;
  }, [users]);


  if (isPageLoading) {
    return (
      <div className="wecode-page-background flex h-screen items-center justify-center text-slate-100">
        <div className="wecode-surface rounded-2xl border px-5 py-3 shadow-2xl shadow-slate-950/30">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400" />
          <span className="text-base font-medium tracking-wide text-slate-200">Joining room...</span>
        </div>
      </div>
    );
  }

  if (roomError && !hasJoinedRoom) {
    return (
      <div className="wecode-page-background flex h-screen items-center justify-center px-5 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/25 bg-[var(--brand-bg-soft)] p-6 shadow-2xl shadow-black/30">
          <h1 className="text-lg font-semibold">Could not join this room</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">{roomError}</p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={retryRoomJoin}
              className="wecode-button wecode-button--primary"
            >
              Try again
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="wecode-button wecode-button--ghost"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const writtenOutput = output?.trim();

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[var(--brand-bg)] text-slate-50">
        <aside className="w-[280px] border-r border-slate-600/50 bg-[var(--brand-bg-soft)] backdrop-blur-xl">
          <div className="border-b border-slate-800 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-sm font-bold text-cyan-300 ring-1 ring-cyan-400/30">
                WC
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  WeCode
                </p>
                <h1 className="truncate text-sm font-semibold text-slate-100">
                  Collaboration room
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="wecode-surface-inset rounded-2xl border p-3 shadow-lg shadow-slate-950/15">
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                <span>Room</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-300 ring-1 ring-emerald-400/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>
              <p className="mt-3 truncate text-lg font-semibold text-slate-50">{roomId}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{users.length} online</span>
                <span>{isHost ? "Host" : "Guest"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-medium text-slate-200">Participants</h3>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                {users.length}
              </span>
            </div>

            <ul className="space-y-2">
              {users.map((user) => {
                const isCurrentUser = user.userId === userId;
                const isSelected = selectedUserId === user.userId;
                const isHostUser = user.userId === hostUserId;

                return (
                  <li
                    key={user.userId}
                    onClick={() => {
                      if (!isHost || isCurrentUser) return;
                      setSelectedUserId((prev) => (prev === user.userId ? null : user.userId));
                    }}
                    className={`cursor-pointer rounded-2xl border p-2.5 transition-all duration-200 ${
                      isSelected
                        ? "border-cyan-500/50 bg-slate-800/90 shadow-md shadow-cyan-500/10"
                        : "wecode-surface-raised wecode-surface-hover border hover:border-slate-600"
                    } ${isHost && !isCurrentUser ? "hover:translate-x-0.5" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-xs font-semibold text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-100">
                            <span className="truncate">{user.username}</span>
                            {isCurrentUser && (
                              <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span className={`h-1.5 w-1.5 rounded-full ${isHostUser ? "bg-amber-400" : "bg-emerald-400"}`} />
                            {isHostUser ? "Host" : "Collaborator"}
                          </div>
                        </div>
                      </div>

                      {isHostUser && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/30">
                          Host
                        </span>
                      )}
                    </div>

                    {isHost && isSelected && !isCurrentUser && !isHostUser && (
                      <div
                        className="mt-3 flex gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <button
                          onClick={() => setKickTarget(user)}
                          className="wecode-button wecode-button--danger wecode-button--compact"
                        >
                          Kick
                        </button>
                        <button
                          onClick={() => setHostTransferTarget(user)}
                          className="wecode-button wecode-button--chip wecode-button--compact"
                        >
                          Make host
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col bg-[var(--brand-bg)]">
          {roomError && hasJoinedRoom && (
            <div role="status" className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
              {roomError}
            </div>
          )}
          <header className="border-b border-slate-600/50 bg-[var(--brand-bg-soft)]/95 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300 ring-1 ring-cyan-400/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    Active
                  </span>
                  <span>Session</span>
                </div>
                <h2 className="mt-2 truncate text-xl font-semibold text-slate-50">{roomId}</h2>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={copyInviteLink}
                  title="Copy invite link"
                  className="wecode-button wecode-button--chip"
                >
                  {inviteCopied ? "Copied" : "Copy link"}
                </button>

                <button
                  onClick={() => setIsPanelOpen((prev) => !prev)}
                  className="wecode-button wecode-button--ghost px-3"
                  aria-label="Toggle comments"
                >
                  💬
                </button>

                <div className="wecode-button wecode-button--ghost flex items-center gap-2 px-3 pr-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Language
                  </span>
                  <select
                    disabled={!isHost}
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="wecode-select text-sm font-medium disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-50">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isHost && (
                  <button
                    onClick={() => runCode(input)}
                    disabled={isRunning || !isHost}
                    className={`wecode-button wecode-button--primary ${isRunning ? "opacity-80 cursor-not-allowed" : ""}`}
                  >
                    {isRunning ? "Running..." : "Run code"}
                  </button>
                )}

                <button
                  onClick={leaveRoom}
                  className="wecode-button wecode-button--danger"
                >
                  Leave
                </button>

                {isHost && (
                  <button
                    onClick={() => setShowDeleteRoomModal(true)}
                    className="wecode-button wecode-button--danger"
                  >
                    Delete room
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-slate-600/50 bg-[var(--brand-bg-soft)]/80 px-4 py-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-200">Editor</span>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                  {language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Live sync</span>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <Editor
                options={{
                  glyphMargin: true,
                  minimap: { enabled: true },
                  fontSize: 14,
                  padding: { top: 18, bottom: 18 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  roundedSelection: true,
                  smoothScrolling: true,
                  scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  },
                }}
                height="100%"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={onCodeChange}
                onMount={(editor, monaco) => {
                  monaco.editor.setTheme("vs-dark");
                  editorRef.current = editor;
                  bindEditorEvents();
                }}
              />
            </div>
          </div>

          <div
            className={`wecode-surface-inset absolute bottom-0 left-0 right-0 z-20 h-64 border-t border-slate-700 shadow-2xl shadow-slate-950/35 backdrop-blur-sm transition-all duration-300 ease-in-out ${
              isPanelOpen
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <CommentPanel
              onJumpToLine={jumpToLine}
              comments={comments}
              onAddComment={openAddComment}
              onReply={replyToComment}
              resolveComment={resolveComment}
              unresolveComment={unresolveComment}
              isHost={isHost}
              deleteComment={deleteComment}
            />
          </div>

          <div className="border-t border-slate-600/50 bg-[var(--brand-bg-soft)] p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="wecode-surface-raised rounded-2xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-200">Input</h4>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400">stdin</span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="wecode-field h-28 w-full resize-none rounded-xl border p-3 font-mono text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60"
                  placeholder="Provide input for your program..."
                />
              </div>

              <div className="wecode-surface-raised rounded-2xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-200">Output</h4>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                    {writtenOutput ? "Received" : "Waiting"}
                  </span>
                </div>
                <pre className="wecode-surface-inset h-28 overflow-auto rounded-xl border p-3 font-mono text-sm text-slate-100 whitespace-pre-wrap">
                  {writtenOutput || "Run your code to see the output here."}
                </pre>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={!!kickTarget}
        title="Kick user?"
        description={`Are you sure you want to kick ${kickTarget?.username}? This action cannot be undone.`}
        confirmText="Kick"
        onCancel={() => setKickTarget(null)}
        onConfirm={() => {
          if (!kickTarget) return;
          kickUser(kickTarget.userId);
          setKickTarget(null);
        }}
      />
      <ConfirmModal
        open={!!hostTransferTarget}
        title="Transfer host?"
        description={`Do you want to make ${hostTransferTarget?.username} the host? You will lose host privileges.`}
        confirmText="Transfer"
        onCancel={() => setHostTransferTarget(null)}
        onConfirm={() => {
          if (!hostTransferTarget) return;
          transferHost(hostTransferTarget.userId);
          setHostTransferTarget(null);
        }}
      />
      <ConfirmModal
        open={showDeleteRoomModal}
        title="Delete room?"
        description="This will permanently delete the room and all comments. This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setShowDeleteRoomModal(false)}
        onConfirm={() => {
          deleteRoom();
          setShowDeleteRoomModal(false);
        }}
      />

      <AddCommentModal
        open={isModalOpen}
        lineNumber={commentLine}
        onClose={closeModal}
        onSubmit={submitComment}
      />
    </>
  );

}