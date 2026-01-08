import { useEffect, useState, useRef } from "react";
import socket from "../socket/socket";
import type { User } from "../types/user.ts"

export function useRoom({ roomId, userId, username }: { roomId: string, userId: string, username: string }) {
    const [users, setUsers] = useState<User[]>([])
    const [hostUserId, setHostUserId] = useState<string | null>(null);
    const isHost = hostUserId !== null && hostUserId === userId;
    // const hasJoinedRef = useRef(false);


    useEffect(() => {
  if (!roomId || !userId || !username) return;

  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("join-room", {
    roomId,
    userId,
    username,
  });

  const handleRoomJoined = (data: {
    users: User[];
    hostUserId: string | null;
  }) => {
    setUsers(data.users ?? []);
    setHostUserId(data.hostUserId ?? null);
  };

  const handleUserJoined = (user: User) => {
    setUsers((prev) =>
      prev.some((u) => u.userId === user.userId)
        ? prev
        : [...prev, user]
    );
  };

  const handleUserLeft = ({ userId }: { userId: string }) => {
    setUsers((prev) => prev.filter((u) => u.userId !== userId));
  };

  const handleHostChanged = ({
    hostUserId,
  }: {
    hostUserId: string | null;
  }) => {
    setHostUserId(hostUserId);
  };

  const handleKicked = ({ reason }: { reason: string }) => {
    alert(reason);
    window.location.href = "/";
  };

  socket.on("kicked", handleKicked)
  socket.on("room-joined", handleRoomJoined);
  socket.on("user-joined", handleUserJoined);
  socket.on("user-left", handleUserLeft);
  socket.on("host-changed", handleHostChanged);

  socket.on("join-denied", ({ reason }) => {
    alert(reason);
    window.location.href = "/";
  });

  return () => {
    socket.off("room-joined", handleRoomJoined);
    socket.off("user-joined", handleUserJoined);
    socket.off("user-left", handleUserLeft);
    socket.off("host-changed", handleHostChanged);
    socket.off("kicked", handleKicked);
  };
}, [roomId, userId, username]);


    const leaveRoom = () => {
        socket.emit("leave-room", { roomId, userId });
        window.location.href="/"
    };

    const kickUser = (targetUserId: string) => {
        if (!isHost) return;

        socket.emit("kick-user", {
            roomId,
            targetUserId,
            userId,
        });
    };

    const transferHost = (newHostId: string) => {
        if (!isHost) return;

        socket.emit("transfer-host", {
            roomId,
            newHostId,
            userId,
        });
    };

    return {
        users,
        hostUserId,
        isHost,
        leaveRoom,
        kickUser,
        transferHost,
    };

}
