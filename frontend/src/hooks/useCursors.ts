import { useEffect, useRef } from "react";
import socket from "../socket/socket";
// import { getColorForUser } from "../utils/colors";

type Params = {
  roomId: string;
  userId: string;
  getUsernameById:(id:string)=>string;
  editorRef: React.MutableRefObject<any>;
};

const COLORS = [
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#ec4899",
];

const getColorForUser = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};



export function useCursors({
  roomId,
  userId,
  getUsernameById,
  editorRef,
}: Params) {
  const cursorDecorations = useRef<Map<string, string[]>>(new Map());
  const selectionDecorations = useRef<Map<string, string[]>>(new Map());
  const throttleRef = useRef<number | null>(null);

  const clearRemoteUser = (remoteUserId: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const cursor = cursorDecorations.current.get(remoteUserId);
    if (cursor) {
      editor.deltaDecorations(cursor, []);
      cursorDecorations.current.delete(remoteUserId);
    }

    const selection = selectionDecorations.current.get(remoteUserId);
    if (selection) {
      editor.deltaDecorations(selection, []);
      selectionDecorations.current.delete(remoteUserId);
    }
  };

  const getCursorClass = (userId: string) =>
    `remote-cursor-${userId.replace(/[^a-zA-Z0-9_-]/g, "")}`;


  useEffect(() => {
    const handleCursorUpdate = (data: any) => {
      if (!editorRef.current) return;
      if (data.userId === userId) return;

      const editor = editorRef.current;
      const color = getColorForUser(data.userId)
      const className = getCursorClass(data.userId)
      const cursorClass = getCursorClass(data.userId);
      const username = getUsernameById(data.userId);
      if (!document.getElementById(className)) {
        const style = document.createElement("style");
        style.id = className;
        style.innerHTML = `
    .${className} {
      border-left-color: ${color} !important;
    }
  `;
        document.head.appendChild(style);
      }
      const labelClass = `${className}-label`;

      if (!document.getElementById(labelClass)) {
        const style = document.createElement("style");
        style.id = labelClass;
        style.innerHTML = `
    .${labelClass}::before {
      content: "${username}";
      position: absolute;
      transform: translateY(-1.2em);
      background: ${color};
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 1000;
    }
  `;
        document.head.appendChild(style);
      }

      if (data.position) {
        const oldCursor = cursorDecorations.current.get(data.userId) || [];

        const newCursor = editor.deltaDecorations(oldCursor, [
          {
            range: {
              startLineNumber: data.position.lineNumber,
              startColumn: data.position.column,
              endLineNumber: data.position.lineNumber,
              endColumn: data.position.column + 1,
            },
            options: {
              className: `remote-cursor ${cursorClass}`,
              beforeContentClassName: `remote-cursor-label ${cursorClass}-label`
            },
          },
        ]);
        cursorDecorations.current.set(data.userId, newCursor);
        setTimeout(() => {
          const elements = document.getElementsByClassName(`cursor-${data.userId}`);
          Array.from(elements).forEach((el) => {
            (el as HTMLElement).style.borderLeftColor = color;
          });
        }, 0);
      }

      if (data.selection) {
        const oldSel =
          selectionDecorations.current.get(data.userId) || [];

        const newSel = editor.deltaDecorations(oldSel, [
          {
            range: {
              startLineNumber: data.selection.startLineNumber,
              startColumn: data.selection.startColumn,
              endLineNumber: data.selection.endLineNumber,
              endColumn: data.selection.endColumn,
            },
            options: { className: "remote-selection" },
          },
        ]);

        selectionDecorations.current.set(data.userId, newSel);
      } else {
        const oldSel = selectionDecorations.current.get(data.userId);
        if (oldSel) {
          editor.deltaDecorations(oldSel, []);
          selectionDecorations.current.delete(data.userId);
        }
      }
    };


    const handleUserLeft = ({ userId }: { userId: string }) => {
      clearRemoteUser(userId);
    };

    socket.on("cursor-update", handleCursorUpdate);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("cursor-update", handleCursorUpdate);
      socket.off("user-left", handleUserLeft);
    };
  }, []);

  const bindEditorEvents = () => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    const cursorDisposable = editor.onDidChangeCursorPosition((e: any) => {
      if (throttleRef.current) return;

      throttleRef.current = window.setTimeout(() => {
        throttleRef.current = null;
      }, 40);

      socket.emit("cursor-update", {
        roomId,
        userId,
        position: {
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        },
      });
    });

    const selectionDisposable = editor.onDidChangeCursorSelection((e: any) => {
      socket.emit("cursor-update", {
        roomId,
        userId,
        selection: {
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn,
        },
      });
    });

    return () => {
      cursorDisposable.dispose();
      selectionDisposable.dispose();
    };
  };

  return { bindEditorEvents };
}
