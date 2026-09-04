import { useEffect, useState } from "react";
import type { CommentThread } from "../types/comment";
import type { editor } from "monaco-editor";
import socket from "../socket/socket";


export function useComments({
  roomId,
  editorRef,
}: {
  roomId: string;
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>;
}) {
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentLine, setCommentLine] = useState<number | null>(null);

  useEffect(() => {
    socket.on("comment:init", ({ comments }) => {
      setComments(prev => {
        if (comments.length === 0 && prev.length > 0) {
          return prev; // don't wipe good state
        }
        return comments;
      });
    });


    socket.on("comment:added", (comment: CommentThread) => {
      if (!comment) return;
      setComments((prev) => [...prev, comment]);
    });

    socket.on(
      "comment:replied",
      ({ commentId, reply }) => {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...c.replies, reply] }
              : c
          )
        );
      }
    );

    socket.on("comment:resolved", ({ commentId }) => {
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, resolved: true } : c
        )
      );
    });

    socket.on("comment:unresolved", ({ commentId }) => {
      setComments(prev =>
        prev.map(c =>
          c.id === commentId ? { ...c, resolved: false } : c
        )
      );
    });

    socket.on("comment:deleted", ({ commentId }) => {
      setComments((prev) =>
        prev.filter((c) => c.id !== commentId)
      );
    });



    return () => {
      socket.off("comment:init");
      socket.off("comment:added");
      socket.off("comment:replied");
      socket.off("comment:resolved");
      socket.off("comment:unresolved");
      socket.off("comment:deleted");


    };
  }, []);

  const openAddComment = () => {
    if (!editorRef.current) return;
    const pos = editorRef.current.getPosition();
    if (!pos) return;

    setCommentLine(pos.lineNumber);
    setIsModalOpen(true);
  };

  const submitComment = (message: string) => {
    if (!roomId || !commentLine) return;
    socket.emit("comment:add", { roomId, lineNumber: commentLine, message });
    setIsModalOpen(false);
    setCommentLine(null);
  };

  const replyToComment = (commentId: string, message: string) => {
    socket.emit("comment:reply", {
      roomId,
      commentId,
      message,
    });
  };
  const resolveComment = (commentId: string) => {
    socket.emit("comment:resolve", { roomId, commentId });
  };

  const unresolveComment = (commentId: string) => {
    socket.emit("comment:unresolve", { roomId, commentId });
  };

  const deleteComment = (commentId: string) => {
  socket.emit("comment:delete", {
    roomId,
    commentId,
  });
};


  return {
    comments,
    isPanelOpen,
    setIsPanelOpen,
    isModalOpen,
    commentLine,
    openAddComment,
    submitComment,
    replyToComment,
    closeModal: () => setIsModalOpen(false),
    resolveComment,
    unresolveComment,
    deleteComment,
  };
}
