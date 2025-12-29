import { useParams } from "react-router-dom"
import { useEffect, useState, useRef, } from "react";
import { useLocation } from "react-router-dom";
import socket from "../socket/socket"
import Editor from "@monaco-editor/react";
import ConfirmModal from "../components/ConfirmModal";
import type { CommentThread } from "../types/comment"
import AddCommentModal from "../components/AddCommentModal";
import "../index.css";
import * as monaco from "monaco-editor"
import CommentPanel from "../components/CommentPanel";


const LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "C++", value: "cpp" },
  { label: "Java", value: "java" },
];

type User = {
  userId: string;
  username: string;
};

type RemoteCursor = {
  userId: string;
  position: {
    lineNumber: number;
    column: number;
  };
};
const COLORS = [
  "#ef4444", // red
  "#22c55e", // green
  "#3b82f6", // blue
  "#eab308", // yellow
  "#a855f7", // purple
  "#ec4899", // pink
];

function getColorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}




export default function EditorPage() {
  const userId = localStorage.getItem("userId")!;
  const { roomId } = useParams<{ roomId: string }>();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isRunning, setIsRunning] = useState(false)
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [users, setUsers] = useState<User[]>([])
  const location = useLocation();
  const username =
    (location.state as { username?: string })?.username ?? "Anonymous";

  const debounceRef = useRef<number | null>(null);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const isHost = hostUserId !== null && hostUserId === userId;
  const hasJoinedRef = useRef(false);
  const [kickTarget, setKickTarget] = useState<User | null>(null);
  const [hostTransferTarget, setHostTransferTarget] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const cursorThrottleRef = useRef<number | null>(null);
  const remoteCursorsRef = useRef<Map<string, string[]>>(new Map());
  const remoteSelectionDecorationsRef = useRef<Map<string, string[]>>(new Map());
  const remoteCursorDecorationsRef = useRef<Map<string, string[]>>(new Map());
  const [comments, setComments] = useState<CommentThread[]>([])
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentLine, setCommentLine] = useState<number | null>(null);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(true);
  const gutterDecorationsRef = useRef<string[]>([]);



  useEffect(() => {
    if (!roomId) return;
    if (hasJoinedRef.current) return;

    hasJoinedRef.current = true;
    if (!socket.connected) {
      socket.connect();
    }

    const editor = editorRef.current;


    socket.emit("join-room", { roomId, username, userId });

    const handleRoomJoined = (data: any) => {
      setCode(data.code);
      setLanguage(data.language);
      setUsers(data.users);
      setHostUserId(data.hostUserId);
    };
    const handleUserJoined = (user: User) => {
      setUsers(prev =>
        prev.some(u => u.userId === user.userId)
          ? prev
          : [...prev, user]
      );
    };
    const handleUserLeft = ({ userId }: { userId: string }) => {
      setUsers(prev => prev.filter(u => u.userId !== userId));
      clearRemoteUserDecorations(userId);
    };
    const handleHostChanged = ({ hostUserId }: { hostUserId: string | null }) => {
      setHostUserId(hostUserId);
      setSelectedUserId(null);
    };
    socket.on("room-joined", handleRoomJoined)

    socket.on("user-joined", handleUserJoined);

    socket.on("code-update", (data) => {
      console.log("CODE UPDATE:", data.code);
      setCode(data.code);
    })

    socket.on("language-update", (data) => {
      setLanguage(data.language);
    })

    socket.on("execution-result", (data) => {
      console.log("execution Result:", data)
      setIsRunning(false);

      if (data.error) {
        setOutput(data.error)
      } else {
        setOutput(data.output)
      }
    })

    const handleRemoteCursor = (data: any) => {
      if (!editorRef.current) return;
      if (data.userId === userId) return;

      const editor = editorRef.current;
      const color = getColorForUser(data.userId);

      // ---------- CURSOR ----------
      if (data.position) {
        const cursorDecoration = {
          range: {
            startLineNumber: data.position.lineNumber,
            startColumn: data.position.column,
            endLineNumber: data.position.lineNumber,
            endColumn: data.position.column + 1,
          },
          options: {
            className: "remote-cursor",
            beforeContentClassName: `remote-cursor-label user-${data.userId}`,
            overviewRuler: {
              color,
              position: 4,
            },
          },
        };

        const oldCursorDecorations =
          remoteCursorDecorationsRef.current.get(data.userId) || [];

        const newCursorDecorations = editor.deltaDecorations(
          oldCursorDecorations,
          [cursorDecoration]
        );

        remoteCursorDecorationsRef.current.set(
          data.userId,
          newCursorDecorations
        );

        setTimeout(() => {
          const labels = document.getElementsByClassName(`user-${data.userId}`);
          Array.from(labels).forEach((el) => {
            el.setAttribute("data-username", data.username);
            (el as HTMLElement).style.setProperty(
              "--cursor-color",
              getColorForUser(data.userId)
            );
            (el as HTMLElement).style.setProperty(
              "--selection-color",
              getColorForUser(data.userId)
            );
          });
        }, 0);

      }

      // ---------- SELECTION ----------
      if (data.selection) {
        const selectionDecoration = {
          range: {
            startLineNumber: data.selection.startLineNumber,
            startColumn: data.selection.startColumn,
            endLineNumber: data.selection.endLineNumber,
            endColumn: data.selection.endColumn,
          },
          options: {
            className: "remote-selection",
            overviewRuler: {
              color,
              position: 4,
            },
          },
        };

        const oldSelectionDecorations =
          remoteSelectionDecorationsRef.current.get(data.userId) || [];

        const newSelectionDecorations = editor.deltaDecorations(
          oldSelectionDecorations,
          [selectionDecoration]
        );

        remoteSelectionDecorationsRef.current.set(
          data.userId,
          newSelectionDecorations
        );
        if (data.selection === "__CLEAR__") {
          const oldSelections =
            remoteSelectionDecorationsRef.current.get(data.userId);

          if (oldSelections) {
            editor.deltaDecorations(oldSelections, []);
            remoteSelectionDecorationsRef.current.delete(data.userId);
          }
        }
      }
    };


    const clearRemoteUserDecorations = (userId: string) => {
      if (!editorRef.current) return;

      const cursorDecos = remoteCursorDecorationsRef.current.get(userId);
      if (cursorDecos) {
        editorRef.current.deltaDecorations(cursorDecos, []);
        remoteCursorDecorationsRef.current.delete(userId);
      }

      const selectionDecos = remoteSelectionDecorationsRef.current.get(userId);
      if (selectionDecos) {
        editorRef.current.deltaDecorations(selectionDecos, []);
        remoteSelectionDecorationsRef.current.delete(userId);
      }
    };

    socket.on("comment:init", ({ comments }) => {
      setComments(
        Array.isArray(comments)
          ? comments.filter(Boolean)
          : []
      );
    });

    socket.on("comment:added", (comment: CommentThread) => {
      if (!comment) return
      setComments((prev) => [...prev, comment])
    });

    socket.on("comment:updated", (updatedThread: CommentThread) => {
      setComments((prev) => prev.map((c) => (c.id === updatedThread.id ? updatedThread : c))
      );
    });

    socket.on("cursor-update", handleRemoteCursor);

    socket.on("host-changed", handleHostChanged);

    socket.on("kicked", ({ roomId, reason }) => {
      alert(reason);
      window.location.href = "/";
      setSelectedUserId(null);
      remoteCursorDecorationsRef.current.clear();
      remoteSelectionDecorationsRef.current.clear();
    })

    socket.on("user-left", handleUserLeft);


    return () => {

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }


      hasJoinedRef.current = false;
      socket.off("room-joined", handleRoomJoined);
      socket.off("user-joined", handleUserJoined);
      socket.off("code-update");
      socket.off("language-update");
      socket.off("execution-result")
      socket.off("host-changed", handleHostChanged);
      socket.off("comment:init");
      socket.off("comment:added");
      socket.off("comment:updated")
      socket.off("kicked");
      socket.off("cursor-update", handleRemoteCursor);
      socket.on("join-denied", ({ reason }) => {
        alert(reason);
        window.location.href = "/";
      });

      socket.off("user-left", handleUserLeft);
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current) return;
    const t = setTimeout(() => editorRef.current.layout(), 310);
    return () => clearTimeout(t);
  }, [isCommentPanelOpen]);

  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;

    const uniqueLines = Array.from(new Set(comments.map((c) => c.lineNumber)))

    const decorations = uniqueLines.map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        glyphMarginClassName: "comment-glyph",
        glyphMarginHoverMessage: {
          value: "View comments",
        },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }))
    gutterDecorationsRef.current = editor.deltaDecorations(
      gutterDecorationsRef.current,
      decorations
    );
  }, [comments])

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return;
    setCode(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      if (socket.connected)
        socket.emit("code-change", {
          roomId,
          code: value,
        })
    }, 300)

  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newlang = e.target.value;
    setLanguage(newlang);

    socket.emit("language-change", {
      roomId,
      language: newlang,
      userId,
    })
  }

  const handleRun = () => {
    if (!roomId) return;
    setIsRunning(true);
    setOutput("running...")
    socket.emit("run-code", {
      roomId,
      code,
      language,
      input,
      userId,
    })
  }

  const handleLeaveRoom = () => {
    if (!roomId) return;

    socket.emit("leave-room", {
      roomId,
      userId,
    });
    window.location.href = "/";
  };

  const JumpToLine = (line: number) => {
    if (!editorRef.current) return;
    editorRef.current.revealLineInCenter(line);
    editorRef.current.setPosition({ lineNumber: line, column: 1 });
    editorRef.current.focus();
  }

  const handleAddComment = () => {
    if (!editorRef.current || !roomId) return;

    const pos = editorRef.current.getPosition();
    if (!pos) return;

    setCommentLine(pos.lineNumber);
    setIsCommentModalOpen(true);
  }

  const submitComment = (message: string) => {
    if (!roomId || !commentLine) return;
    const comment: CommentThread = {
      id: crypto.randomUUID(),
      roomId: roomId!,
      authorId: userId,
      authorName: username,
      message,
      lineNumber: commentLine,
      replies: [],
      createdAt: Date.now(),
    }

    socket.emit("comment:add", { roomId, comment })
    setIsCommentModalOpen(false);
    setCommentLine(null);
  }

  const handleReply = (commentId: string, message: string) => {
    socket.emit("comment:reply", {
      roomId,
      commentId,
      reply: {
        id: crypto.randomUUID(),
        authorId: userId,
        authorName: username,
        message,
        createdAt: Date.now(),
      },
    });
  }


  return <>
    <div className="h-screen flex bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-700 p-4">
        <h3 className="font-semibold mb-3">Users</h3>

        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user.userId}
              onClick={() => {
                if (!isHost) return;
                if (user.userId === userId) return; // cannot select self
                setSelectedUserId(prev =>
                  prev === user.userId ? null : user.userId
                );
              }}
              className={`px-2 py-2 rounded text-sm cursor-pointer transition
                ${selectedUserId === user.userId ? "bg-gray-700" : "bg-gray-800"}
                ${isHost && user.userId !== userId ? "hover:bg-gray-700" : ""}
                `}
            >
              <div className="flex justify-between items-center">
                <span>
                  {user.username}
                  {user.userId === hostUserId && " 👑"}
                </span>
              </div>

              {isHost &&
                selectedUserId === user.userId &&
                user.userId !== hostUserId && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 🔥 IMPORTANT
                        setKickTarget(user);
                      }}
                      className="text-xs bg-red-600 px-2 py-1 rounded"
                    >
                      Kick
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 🔥 IMPORTANT
                        setHostTransferTarget(user);
                      }}
                      className="text-xs bg-blue-600 px-2 py-1 rounded"
                    >
                      Make Host
                    </button>
                  </div>
                )}

            </li>
          ))}
        </ul>
      </aside>


      {/* Main Content */}
      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Room: {roomId}</h2>

          <div className="flex items-center gap-2">
            <button

              onClick={() => {
                console.log("TOGGLE CLICK");
                setIsCommentPanelOpen((prev) => !prev)
              }}
              className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
            >
              💬
            </button>


            <select
              disabled={!isHost}
              value={language}
              onChange={handleLanguageChange}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            {isHost && (
              <button
                onClick={handleRun}
                disabled={isRunning}
                className={`px-4 py-1 rounded ${isRunning
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
                  }`}
              >
                {isRunning ? "Running..." : "Run"}
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-1 rounded bg-red-600 hover:bg-red-700"
            >
              Leave
            </button>


          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <Editor
            options={{
              glyphMargin: true,
              minimap: { enabled: true },
            }}
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={handleCodeChange}
            onMount={(editor) => {
              editorRef.current = editor;

              const cursorListener = editor.onDidChangeCursorPosition((e: any) => {
                if (cursorThrottleRef.current) return;

                cursorThrottleRef.current = window.setTimeout(() => {
                  cursorThrottleRef.current = null;
                }, 50);

                if (!socket.connected || !roomId) return;

                const selection = editor.getSelection();

                socket.emit("cursor-update", {
                  roomId,
                  userId,
                  username,
                  position: {
                    lineNumber: e.position.lineNumber,
                    column: e.position.column,
                  },
                  selection:
                    selection && !selection.isEmpty()
                      ? {
                        startLineNumber: selection.startLineNumber,
                        startColumn: selection.startColumn,
                        endLineNumber: selection.endLineNumber,
                        endColumn: selection.endColumn,
                      }
                      : "__CLEAR__",
                });
              });

              editor.onDidDispose(() => {
                cursorListener.dispose();
              });
            }
            }

          />
        </div>


        <div
          className={`
    absolute bottom-0 left-0 right-0
    h-64 z-20
    bg-gray-900 border-t border-gray-700
    transition-all duration-300 ease-in-out
    transform
    ${isCommentPanelOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-full opacity-0 pointer-events-none"}
           `}
        >
          <CommentPanel
            comments={comments}
            onJumpToLine={JumpToLine}
            onAddComment={handleAddComment}
            onReply={handleReply}
          />
        </div>



        {/* IO Panels */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800">
          <div>
            <h4 className="font-semibold mb-1">Input</h4>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-24 bg-gray-900 border border-gray-700 rounded p-2"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-1">Output</h4>
            <pre className="w-full h-24 bg-black border border-gray-700 rounded p-2 overflow-auto">
              {output}
            </pre>
          </div>
        </div>
      </div>

    </div>
    <ConfirmModal
      open={!!kickTarget}
      title="Kick user?"
      description={`Are you sure you want to kick ${kickTarget?.username}? This action cannot be undone.`}
      confirmText="Kick"
      onCancel={() => setKickTarget(null)}
      onConfirm={() => {
        if (!kickTarget) return;

        socket.emit("kick-user", {
          roomId,
          targetUserId: kickTarget.userId,
          userId,
        });

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

        socket.emit("transfer-host", {
          roomId,
          targetUserId: hostTransferTarget.userId,
          userId,
        });

        setHostTransferTarget(null);
      }}
    />
    <AddCommentModal
      open={isCommentModalOpen}
      lineNumber={commentLine}
      onClose={() => {
        setIsCommentModalOpen(false);
        setCommentLine(null);
      }}
      onSubmit={submitComment}
    />



  </>

}

