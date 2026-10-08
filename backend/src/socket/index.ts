import { Server, Socket } from "socket.io";
import type Room from "../types/room.js";
import type User from "../types/user.js";
import { executeCode } from "../services/codeExecution.js";


import { prisma } from "../lib/prisma.js"
import type { AuthUser } from "../types/auth.js";

const disconnectTimers = new Map<string, NodeJS.Timeout>();
const kickedUsers = new Map<string, Set<string>>();
const roomUsers = new Map<string, Map<string, User>>();


export function initSocket(io: Server) {
    io.on("connection", (socket: Socket) => {
        socket.on("join-room", async (payload: { roomId?: unknown }) => {
            try {
                const roomId = payload?.roomId;
                if (typeof roomId !== "string" || !roomId.trim()) {
                    socket.emit("join-denied", { reason: "A valid room ID is required." });
                    return;
                }

                const { userId, username } = socket.data.user as AuthUser;
                const room = await prisma.room.findUnique({ where: { id: roomId } });
                if (!room) {
                    socket.emit("join-denied", {
                        reason: "Room not found. Check the room ID or ask for a new invite link.",
                    });
                    return;
                }

                if (kickedUsers.get(roomId)?.has(userId)) {
                    socket.emit("join-denied", {
                        reason: "You were kicked from this room",
                    });
                    return;
                }

                const comments = await prisma.commentThread.findMany({
                    where: { roomId },
                    include: { replies: true },
                    orderBy: { createdAt: "asc" },
                });

                let users = roomUsers.get(roomId);
                if (!users) {
                    users = new Map();
                    roomUsers.set(roomId, users);
                }

                const isReconnect = users.has(userId);
                if (isReconnect) {
                    const timer = disconnectTimers.get(userId);
                    if (timer) {
                        clearTimeout(timer);
                        disconnectTimers.delete(userId);
                    }
                }

                users.set(userId, { userId, username, socketId: socket.id });
                await socket.join(roomId);
                socket.emit("room-joined", {
                    roomId,
                    code: room.code,
                    language: room.language,
                    users: Array.from(users.values()),
                    hostUserId: room.hostUserId,
                });
                socket.emit("comment:init", { comments });

                if (!isReconnect) {
                    socket.to(roomId).emit("user-joined", { userId, username });
                }

                console.log(`Socket ${socket.id} joined room ${roomId}`);
            } catch (error) {
                console.error("Room join failed", error);
                socket.emit("join-denied", {
                    reason: "Unable to join the room right now. Please try again.",
                });
            }
        });

        socket.on("code-change", async ({ roomId, code }: { roomId: string, code: string }) => {
            if (!roomUsers.has(roomId)) return;
            socket.to(roomId).emit("code-update", { code });

        })

        socket.on("language-change", async ({ roomId, language }: { roomId: string, language: string }) => {
            const { userId } = socket.data.user as AuthUser;
            const room = await prisma.room.findUnique({ where: { id: roomId } })
            if (!room) return;
            if (room.hostUserId !== userId) {
                return;
            }
            await prisma.room.update({
                where: { id: roomId },
                data: { language }
            })
            socket.to(roomId).emit("language-update", {
                language
            });
        })

        socket.on("run-code", async ({
            roomId, code, language, input
        }: {
            roomId: string,
            code: string,
            language: string,
            input: string
        }) => {
            const { userId } = socket.data.user as AuthUser;
            const room = await prisma.room.findUnique({ where: { id: roomId } });
            if (!room) return;
            if (room.hostUserId !== userId) {
                return;
            }
            try {
                await prisma.room.update({
                    where: {
                        id: roomId
                    },
                    data: {
                        code
                    }
                })
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

        socket.on("cursor-update", ({ roomId, position, selection }) => {
            const { userId, username } = socket.data.user as AuthUser;
            if (!roomUsers.has(roomId)) return;
            socket.to(roomId).emit("cursor-update", {
                userId,
                username,
                position,
                selection,
            });
        });

        socket.on("transfer-host", async ({ roomId, newHostId }: { roomId: string; newHostId: string }) => {
            const { userId } = socket.data.user as AuthUser;

            const room = await prisma.room.findUnique({ where: { id: roomId } });
            if (!room) return;

            if (room.hostUserId !== userId) {
                return;
            }

            await prisma.room.update({
                where: {
                    id: roomId
                },
                data: {
                    hostUserId: newHostId
                }
            })

            io.to(roomId).emit("host-changed", {
                hostUserId: newHostId,
            })
        })

        socket.on("kick-user", async ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
            const { userId } = socket.data.user as AuthUser;
            const room = await prisma.room.findUnique({ where: { id: roomId } });
            if (!room) return;

            if (room.hostUserId !== userId) {
                return;
            }

            const users = roomUsers.get(roomId);
            if (!users) return;

            const kickedUser = users.get(targetUserId);
            if (!kickedUser) return;
            if (targetUserId === userId) return;

            const kickedSocketId = kickedUser.socketId;

            if (!kickedUsers.has(roomId)) kickedUsers.set(roomId, new Set());
            kickedUsers.get(roomId)!.add(targetUserId);

            io.sockets.sockets.get(kickedSocketId)?.leave(roomId);
            io.sockets.sockets.get(kickedSocketId)?.emit("kicked", {
                roomId,
                reason: "You were removed by the host",
            });

            users.delete(targetUserId);

            io.to(roomId).emit("user-left", { userId: targetUserId });
        })

        socket.on("leave-room", async ({ roomId }: { roomId: string }) => {
            const { userId } = socket.data.user as AuthUser;
            const users = roomUsers.get(roomId);
            if (!users) return;

            if (!users.has(userId)) return;

            users.delete(userId);
            socket.leave(roomId);

            socket.to(roomId).emit("user-left", { userId });

            const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
            if (dbRoom?.hostUserId === userId) {
                const next = users.values().next().value;
                const newHost = next?.userId!;
                await prisma.room.update({ where: { id: roomId }, data: { hostUserId: newHost } });

                io.to(roomId).emit("host-changed", { hostUserId: newHost });
            }

            // Delete room users map if empty
            if (users.size === 0) {
                roomUsers.delete(roomId);
                console.log("Room users cleared:", roomId);
            }

            console.log(`User ${userId} left room ${roomId}`);
        });

        socket.on("comment:add",
            async ({ roomId, lineNumber, message }: { roomId: string; lineNumber: number; message: string }) => {
                const { userId: authorId, username: authorName } = socket.data.user as AuthUser;
                const thread = await prisma.commentThread.create({
                    data: {
                        id: crypto.randomUUID(),
                        roomId,
                        authorId,
                        authorName,
                        lineNumber,
                        message,
                    }, include: {
                        replies: true,
                    },
                })
                io.to(roomId).emit("comment:added", thread);
            }
        );


        socket.on("comment:reply",
            async ({ roomId, commentId, message }: { roomId: string; commentId: string; message: string }) => {
                const { userId: authorId, username: authorName } = socket.data.user as AuthUser;
                const reply = await prisma.reply.create({
                    data: {
                        id: crypto.randomUUID(),
                        threadId: commentId,
                        authorId,
                        authorName,
                        message,
                    },
                });

                io.to(roomId).emit("comment:replied", {
                    commentId,
                    reply,
                });
            }
        );

        socket.on("comment:resolve", async ({ roomId, commentId }) => {
            await prisma.commentThread.update({
                where: { id: commentId },
                data: { resolved: true },
            })

            io.to(roomId).emit("comment:resolved", { commentId });
        });

        socket.on("comment:unresolve", async ({ roomId, commentId }) => {
            await prisma.commentThread.update({
                where: { id: commentId },
                data: { resolved: false },
            })

            io.to(roomId).emit("comment:unresolved", { commentId });
        });

        socket.on("comment:delete",
            async ({ roomId, commentId }: { roomId: string; commentId: string }) => {
                const { userId } = socket.data.user as AuthUser;
                const room = await prisma.room.findUnique({
                    where: { id: roomId },
                });
                if (!room) return;

                const comment = await prisma.commentThread.findUnique({
                    where: { id: commentId },
                });
                if (!comment) return;

                // permission check
                const canDelete =
                    comment.authorId === userId || room.hostUserId === userId;

                if (!canDelete) return;

                // delete replies first (important)
                await prisma.reply.deleteMany({
                    where: { threadId: commentId },
                });

                await prisma.commentThread.delete({
                    where: { id: commentId },
                });

                io.to(roomId).emit("comment:deleted", { commentId });
            }
        );

        socket.on(
            "room:delete",
            async ({ roomId }: { roomId: string }) => {
                const { userId } = socket.data.user as AuthUser;
                const room = await prisma.room.findUnique({
                    where: { id: roomId },
                });
                if (!room) return;

                if (room.hostUserId !== userId) return;

                await prisma.reply.deleteMany({
                    where: {
                        thread: { roomId },
                    },
                });

                await prisma.commentThread.deleteMany({
                    where: { roomId },
                });

                await prisma.room.delete({
                    where: { id: roomId },
                });

                io.to(roomId).emit("room:deleted");

                roomUsers.delete(roomId);
                kickedUsers.delete(roomId);
            }
        );



        socket.on("disconnect", () => {
            for (const [roomId, users] of roomUsers.entries()) {
                for (const [userId, user] of users.entries()) {
                    if (user.socketId === socket.id) {
                        const timer = setTimeout(() => {
                            users.delete(userId);

                            socket.to(roomId).emit("user-left", { userId });

                            (async () => {
                                try {
                                    const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
                                    if (dbRoom?.hostUserId === userId) {
                                        const next = users.values().next().value;
                                        const newHost = next?.userId!;
                                        await prisma.room.update({ where: { id: roomId }, data: { hostUserId: newHost } });
                                        io.to(roomId).emit("host-changed", { hostUserId: newHost });
                                    }
                                } catch (err) {
                                    console.error("disconnect host update failed", err);
                                }
                            })();

                            if (users.size === 0) {
                                roomUsers.delete(roomId);
                                console.log("Room users cleared:", roomId);
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
