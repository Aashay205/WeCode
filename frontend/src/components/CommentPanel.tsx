import type { CommentThread } from "../types/comment";
import React from "react"

type props = {
  comments: CommentThread[];
  onJumpToLine: (lineNumber: number) => void;
  onAddComment: () => void;
  onReply: (comment: string, message: string) => void;
  resolveComment: (id: string) => void;
  unresolveComment: (id: string) => void;
  deleteComment: (id: string) => void;
  isHost: boolean;
}

export default function CommentPanel({
  comments,
  onJumpToLine,
  onAddComment,
  onReply,
  resolveComment,
  unresolveComment,
  deleteComment,
  isHost,
}: props) {
  return (
    <aside className="wecode-page-background h-full w-full overflow-y-auto p-4 text-slate-100">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(94,232,255,0.7)]" />
          <h3 className="text-2xl font-semibold tracking-tight text-slate-50">Comments</h3>
        </div>

        <button
          onClick={onAddComment}
          className="wecode-button wecode-button--chip px-4 text-sm"
        >
          + Add
        </button>
      </div>

      {comments.length === 0 && (
        <div className="wecode-surface-raised mt-6 rounded-2xl border p-5 text-slate-300 shadow-lg shadow-slate-950/10">
          <p className="text-base text-slate-300">
            No comments yet. Add one from the editor.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {comments.filter((thread): thread is NonNullable<typeof thread> => thread !== null).map((thread) => (
          <div
            key={thread.id}
            className={`rounded-2xl border p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/20 ${
              thread.resolved
                ? "wecode-surface opacity-80"
                : "wecode-surface-inset"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                onClick={() => onJumpToLine(thread.lineNumber)}
                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-cyan-200 transition hover:bg-cyan-500/15"
              >
                Line {thread.lineNumber}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    thread.resolved
                      ? unresolveComment(thread.id)
                      : resolveComment(thread.id)
                  }
                  className="text-[11px] font-medium text-cyan-300 transition hover:text-cyan-200"
                >
                  {thread.resolved ? "Reopen" : "Resolve"}
                </button>

                {(thread.authorId === thread.id || isHost) && (
                  <button
                    onClick={() => deleteComment(thread.id)}
                    className="text-[11px] font-medium text-rose-300 transition hover:text-rose-200"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-[11px] font-semibold text-white">
                {thread.authorName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-slate-100">{thread.authorName}</p>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-300">{thread.message}</p>

            <div className="mt-3 space-y-2 border-l border-slate-800 pl-3">
              {thread.replies.map((reply) => (
                <div key={reply.id} className="wecode-surface rounded-xl p-2.5 text-sm">
                  <span className="font-semibold text-slate-100">{reply.authorName}:</span>{" "}
                  <span className="text-slate-300">{reply.message}</span>
                </div>
              ))}
            </div>

            {!thread.resolved && (
              <ReplyBox onSubmit={(msg) => onReply(thread.id, msg)} />
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

function ReplyBox({ onSubmit }: { onSubmit: (msg: string) => void }) {
  const [value, setValue] = React.useState("");

  return (
    <div className="mt-3 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Reply..."
        className="wecode-field flex-1 rounded-xl border px-3 py-2 text-sm placeholder:text-slate-400 outline-none transition focus:border-cyan-500/60"
      />
      <button
        onClick={() => {
          if (!value.trim()) return;
          onSubmit(value);
          setValue("");
        }}
        className="wecode-button wecode-button--primary wecode-button--compact"
      >
        Send
      </button>
    </div>
  );
}
