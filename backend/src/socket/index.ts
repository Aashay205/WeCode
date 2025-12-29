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
        socket.on("join-room", ({ roomId, username, userId }: { roomId: string, username: string, userId: string }) => {
            if (!rooms.has(roomId)) {
                const newRoom: Room = {
                    hostUserId: userId,
                    users: new Map(),
                    code: "",
                    language: "javascript"
                };
                rooms.set(roomId, newRoom)
            }
            const room = rooms.get(roomId);
            if (!room) return;
            if (kickedUsers.get(roomId)?.has(userId)) {
                socket.emit("join-denied", {
                    reason: "You were kicked from this room",
                });
                return;
            }

            if (room.users.has(userId)) {

                const timer = disconnectTimers.get(userId);
                if (timer) {
                    clearTimeout(timer);
                    disconnectTimers.delete(userId);
                }

                const user = room.users.get(userId)!;
                user.socketId = socket.id;

                socket.join(roomId);

                socket.emit("room-joined", {
                    roomId,
                    code: room.code,
                    language: room.language,
                    users: Array.from(room.users.values()),
                    hostUserId: room.hostUserId,
                });

                return;
            }


            const user: User = {
                userId,
                socketId: socket.id,
                username,
            };


            room.users.set(userId, user);
            socket.join(roomId)

            socket.emit("room-joined", {
                roomId,
                code: room.code,
                language: room.language,
                users: Array.from(room.users.values()),
                usersCount: room.users.size,
                hostId: room.hostUserId,
            });

            io.to(roomId).emit("user-joined", {
                socketId: socket.id,
                username
            })

            console.log(`Socket ${socket.id} joined room ${roomId}`)

            socket.emit("comment:init", {
                comments: roomComments.get(roomId) ?? [],
            })

        })

        socket.on("code-change", ({ roomId, code }: { roomId: string, code: string }) => {
            const room = rooms.get(roomId);
            if (!room) return;

            room.code = code;

            socket.to(roomId).emit("code-update", {
                code
            });
        })

        socket.on("language-change", ({ roomId, language }: { roomId: string, language: string }) => {
            const room = rooms.get(roomId);
            if (!room) return;
            if (socket.id !== room.hostUserId) {
                return;
            }
            room.language = language;

            io.to(roomId).emit("language-update", {
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
                    language,
                });
            } catch (error) {
                io.to(roomId).emit("execution-result", {
                    output: "",
                    error: "Execution failed",
                    language,
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

            room.users.delete(targetUserId);

            io.sockets.sockets
                .get(kickedUser.socketId)
                ?.leave(roomId);

            io.to(roomId).emit("user-left", { userId: targetUserId });

            io.to(kickedUser.socketId).emit("kicked", {
                roomId,
                reason: "You were removed by the host",
            });

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

        socket.on("comment:add", ({ roomId, comment }: { roomId: string; comment: CommentThread }) => {
            
            if (!comment || !comment.id || !comment.lineNumber) return;
            if (!roomComments.has(roomId)) {
                roomComments.set(roomId, []);
            }


            roomComments.get(roomId)!.push(comment);

            io.to(roomId).emit("comment:added", comment)
        })

        socket.on("comment:reply", ({
            roomId,
            commentId,
            reply }: {
                roomId: string;
                commentId: string;
                reply: Reply;
            }) => {
            const comments = roomComments.get(roomId);
            if (!comments) return;

            const thread = comments.find((c) => c.id === commentId);
            if (!thread) return;

            thread.replies.push(reply);
            io.to(roomId).emit("comment:updated", thread);

        })

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
