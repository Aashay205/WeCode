import { Server, Socket } from "socket.io";
import type Room from "../types/room.js";
import type User from "../types/user.js";
import { executeCode } from "../services/codeExecution.js";
import type { CommentThread } from "../types/comments.js";
import type { Reply } from "../types/comments.js";

const disconnectTimers = new Map<string, NodeJS.Timeout>();
const kickedUsers = new Map<string, Set<string>>();
const rooms = new Map<string, Room>();
const roomComments = new Map<string, CommentThread[]>()

export function initSocket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.on("join-room", ({ roomId, username, userId }) => {
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    hostUserId: userId,
                    users: new Map(),
                    code: "",
                    language: "javascript",
                });
            }

            const room = rooms.get(roomId);
            if (!room) return;

            if (kickedUsers.get(roomId)?.has(userId)) {
                socket.emit("join-denied", {
                    reason: "You were kicked from this room",
                });
                return;
            }

            // Reconnect
            if (room.users.has(userId)) {
                const timer = disconnectTimers.get(userId);
                if (timer) {
                    clearTimeout(timer);
                    disconnectTimers.delete(userId);
                }

                room.users.get(userId)!.socketId = socket.id;
                socket.join(roomId);

                socket.emit("room-joined", {
                    roomId,
                    code: room.code,
                    language: room.language,
                    users: Array.from(room.users.values()),
                    hostUserId: room.hostUserId,
                });

                socket.emit("comment:init", {
                    comments: roomComments.get(roomId) ?? [],
                })
                return;
            }

            room.users.set(userId, {
                userId,
                username,
                socketId: socket.id,
            });

            socket.join(roomId);

            socket.emit("room-joined", {
                roomId,
                code: room.code,
                language: room.language,
                users: Array.from(room.users.values()),
                hostUserId: room.hostUserId,
            });

            socket.to(roomId).emit("user-joined", {
                userId,
                username,
            });

            socket.emit("comment:init", {
                comments: roomComments.get(roomId) ?? [],
            });

            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        socket.on("code-change", ({ roomId, code }: { roomId: string, code: string }) => {
            const room = rooms.get(roomId);
            if (!room) return;

            room.code = code;

            socket.to(roomId).emit("code-update", {
                code
            });
        })

        socket.on("language-change", ({ roomId, language, userId }: { roomId: string, language: string, userId: string }) => {
            const room = rooms.get(roomId);
            if (!room) return;
            if (room.hostUserId !== userId) {
                return;
            }
            room.language = language;

            socket.to(roomId).emit("language-update", {
                language
            });
        })

        socket.on("run-code", async ({
            roomId, userId, code, language, input
        }: {
            roomId: string,
            userId: string,
            code: string,
            language: string,
            input: string
        }) => {
            const room = rooms.get(roomId);
            if (!room) return;
            if (room.hostUserId !== userId) {
                return;
            }
            try {
                room.code = code;
                room.language = language;

                const result = await executeCode(code, language, input);

                io.to(roomId).emit("execution-result", {
                    output: result.output,
                    error: result.error,
                });
            } catch (error) {
                io.to(roomId).emit("execution-result", {
                    output: "",
                    error: "Execution failed",
                });
            }

        })

        socket.on("cursor-update", ({ roomId, userId, position, username, selection }) => {
            if (!rooms.has(roomId)) return;
            socket.to(roomId).emit("cursor-update", {
                userId,
                username,
                position,
                selection,

            })
        }
        )

        socket.on("transfer-host", ({ roomId, newHostId, userId }: { roomId: string; newHostId: string; userId: string }) => {

            const room = rooms.get(roomId);
            if (!room) return;

            if (room.hostUserId !== userId) {
                return;
            }

            if (!room.users.has(newHostId)) {
                return;
            }

            room.hostUserId = newHostId;

            io.to(roomId).emit("host-changed", {
                hostUserId: room.hostUserId,
            })
        })

        socket.on("kick-user", ({ roomId, targetUserId, userId }: { roomId: string; targetUserId: string; userId: string }) => {
            const room = rooms.get(roomId);
            if (!room) return;

            if (room.hostUserId !== userId) {
                return;
            }
            const kickedUser = room.users.get(targetUserId);
            if (!kickedUser) {
                return
            }
            if (targetUserId == userId) return;
            const kickedSocketId = kickedUser.socketId;


            if (!kickedUsers.has(roomId)) {
                kickedUsers.set(roomId, new Set());
            }
            kickedUsers.get(roomId)!.add(targetUserId);

            io.sockets.sockets
                .get(kickedSocketId)
                ?.leave(roomId);

            io.to(kickedSocketId).emit("kicked", {
                roomId,
                reason: "You were removed by the host",
            });

            room.users.delete(targetUserId);

            io.to(roomId).emit("user-left", { userId: targetUserId });

        })

        socket.on("leave-room",
            ({ roomId, userId }: { roomId: string; userId: string }) => {
                const room = rooms.get(roomId);
                if (!room) return;

                if (!room.users.has(userId)) return;


                room.users.delete(userId);
                socket.leave(roomId);


                socket.to(roomId).emit("user-left", { userId });


                if (room.hostUserId === userId) {
                    const next = room.users.values().next().value;
                    room.hostUserId = next?.userId ?? null;

                    socket.to(roomId).emit("host-changed", {
                        hostUserId: room.hostUserId,
                    });
                }

                // Delete room if empty
                if (room.users.size === 0) {
                    rooms.delete(roomId);
                    console.log("Room deleted:", roomId);
                }

                console.log(`User ${userId} left room ${roomId}`);
            }
        );

        socket.on("comment:add",
            ({ roomId, lineNumber, message, authorId, authorName }) => {
                const thread: CommentThread = {
                    id: crypto.randomUUID(),
                    roomId,
                    authorId,
                    authorName,
                    lineNumber,
                    message,
                    replies: [],
                    createdAt: Date.now(),
                    resolved: false,
                };

                if (!roomComments.has(roomId)) {
                    roomComments.set(roomId, []);
                }

                roomComments.get(roomId)!.push(thread);

                io.to(roomId).emit("comment:added", thread);
            }
        );


        socket.on("comment:reply",
            ({ roomId, commentId, message, authorId, authorName }) => {
                const threads = roomComments.get(roomId);
                if (!threads) return;

                const thread = threads.find(t => t.id === commentId);
                if (!thread) return;

                const reply: Reply = {
                    id: crypto.randomUUID(),
                    authorId,
                    authorName,
                    message,
                    createdAt: Date.now(),
                };

                thread.replies.push(reply);

                io.to(roomId).emit("comment:replied", {
                    commentId,
                    reply,
                });
            }
        );

        socket.on("comment:resolve", ({ roomId, commentId }) => {
            const threads = roomComments.get(roomId);
            if (!threads) return;

            const thread = threads.find(t => t.id === commentId);
            if (!thread) return;

            thread.resolved = true;

            io.to(roomId).emit("comment:resolved", { commentId });
        });

        socket.on("comment:unresolve", ({ roomId, commentId }) => {
            const threads = roomComments.get(roomId);
            if (!threads) return;

            const thread = threads.find(t => t.id === commentId);
            if (!thread) return;

            thread.resolved = false;

            io.to(roomId).emit("comment:unresolved", { commentId });
        });


        socket.on("disconnect", () => {
            for (const [roomId, room] of rooms.entries()) {
                for (const [userId, user] of room.users.entries()) {
                    if (user.socketId === socket.id) {
                        const timer = setTimeout(() => {
                            room.users.delete(userId);

                            socket.to(roomId).emit("user-left", { userId });


                            if (room.hostUserId === userId) {
                                const next = room.users.values().next().value;
                                room.hostUserId = next?.userId ?? null;

                                io.to(roomId).emit("host-changed", {
                                    hostUserId: room.hostUserId,
                                });
                            }

                            if (room.users.size === 0) {
                                rooms.delete(roomId);
                                console.log("Room deleted:", roomId);
                            }

                            disconnectTimers.delete(userId);
                        }, 5000);

                        disconnectTimers.set(userId, timer);
                        return;
                    }
                }
            }
        });

    });
}
