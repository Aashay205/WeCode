import type { CommentThread } from "../types/comment"
import React from "react"

type props={
    comments:CommentThread[];
    onJumpToLine:(lineNumber:number)=>void;
    onAddComment:()=>void;
    onReply:(comment:string,message:string)=>void;
}

export default function CommentPanel({
    comments,
    onJumpToLine,
    onAddComment,
    onReply,
}:props){
     return (
    <aside className="w-full h-full border-l border-gray-700 bg-gray-900 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">💬 Comments</h3>
        <button
          onClick={onAddComment}
          className="text-xs bg-blue-600 px-2 py-1 rounded"
        >
          + Add
        </button>
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-gray-400">
          No comments yet. Add one from the editor.
        </p>
      )}

      <div className="space-y-4">
        {comments.filter((thread): thread is NonNullable<typeof thread> => thread !== null).map((thread) => (
          <div
            key={thread.id}
            className="bg-gray-800 p-3 rounded border border-gray-700"
          >
            <button
              onClick={() => onJumpToLine(thread.lineNumber)}
              className="text-xs text-blue-400 hover:underline"
            >
              Line {thread.lineNumber}
            </button>

            <p className="text-sm font-semibold mt-1">
              {thread.authorName}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {thread.message}
            </p>

            {/* Replies */}
            <div className="mt-2 space-y-1">
              {thread.replies.map((reply) => (
                <div key={reply.id} className="ml-3 text-sm">
                  <span className="font-semibold">
                    {reply.authorName}:
                  </span>{" "}
                  <span className="text-gray-300">
                    {reply.message}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply input */}
            <ReplyBox
              onSubmit={(msg) => onReply(thread.id, msg)}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}

function ReplyBox({onSubmit}:{onSubmit:(msg:string)=>void}){
    const [value,setValue]=React.useState("");
    
  return (
    <div className="mt-2 flex gap-1">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Reply..."
        className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
      />
      <button
        onClick={() => {
          if (!value.trim()) return;
          onSubmit(value);
          setValue("");
        }}
        className="text-xs bg-green-600 px-2 rounded"
      >
        Send
      </button>
    </div>
  );
}
