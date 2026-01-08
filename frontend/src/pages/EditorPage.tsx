import { useParams } from "react-router-dom"
import { useEffect, useState, useRef, } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const username =
    (location.state as { username?: string })?.username ?? "Anonymous";
  const [kickTarget, setKickTarget] = useState<User | null>(null);
  const [hostTransferTarget, setHostTransferTarget] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const usersRef = useRef<Map<string, string>>(new Map());



  // HOOKS LOGIC
  const {
    users,
    hostUserId,
    isHost,
    leaveRoom,
    kickUser,
    transferHost,
  } = useRoom({
    roomId: roomId!,
    userId,
    username,
  });

 
 const getUsernameById = (id: string) => {
  return usersRef.current.get(id) ?? "User";
};


  const {
    code,
    setCode,
    language,
    onCodeChange,
    onLanguageChange,
    runCode,
    output,
    isRunning,
  }=useEditorSync({
    roomId:roomId!,
    userId,
    isHost
  })

  const { bindEditorEvents} = useCursors({
  roomId: roomId!,
  userId,
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
    unresolveComment
  }=useComments({
    roomId:roomId!,
    userId,username,editorRef,
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

useEffect(() => {
  const map = new Map<string, string>();
  users.forEach((u) => map.set(u.userId, u.username));
  usersRef.current = map;
}, [users]);


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
                if (user.userId === userId) return; 
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
                  <div className="flex gap-2 mt-2"
                  onClick={(e)=>{e.stopPropagation()}
                  }>
                    <button
                      onClick={()=>{
                        setKickTarget(user)
                      }}
                      className="text-xs bg-red-600 px-2 py-1 rounded"
                    >
                      Kick
                    </button>

                    <button
                      onClick={()=>{
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
                setIsPanelOpen((prev) => !prev)
              }}
              className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
            >
              💬
            </button>


            <select
              disabled={!isHost}
              value={language}
              onChange={(e)=>onLanguageChange(e.target.value)}
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
                onClick={()=>{runCode(input)}}
                disabled={isRunning||!isHost}
                className={`px-4 py-1 rounded ${isRunning
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
                  }`}
              >
                {isRunning ? "Running..." : "Run"}
              </button>
            )}
            <button
              onClick={leaveRoom}
              className="px-4 py-1 rounded bg-red-600 hover:bg-red-700"
            >
              Leave
            </button>


          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            options={{
              glyphMargin: true,
              minimap: { enabled: true },
            }}
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={onCodeChange}
            onMount={(editor) => {
              editorRef.current = editor;
              bindEditorEvents();
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
    ${isPanelOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-full opacity-0 pointer-events-none"}
           `}
        >
          <CommentPanel
            onJumpToLine={jumpToLine}
            comments={comments}
            onAddComment={openAddComment}
            onReply={replyToComment}
            resolveComment={resolveComment}
            unresolveComment={unresolveComment}
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
        if(!kickTarget)return;
        kickUser(kickTarget.userId)
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
        if(!hostTransferTarget)return;
        transferHost(hostTransferTarget.userId)
        setHostTransferTarget(null);
      }}
    />
    <AddCommentModal
      open={isModalOpen}
      lineNumber={commentLine}
      onClose={closeModal}
      onSubmit={submitComment}
    />



  </>

}

