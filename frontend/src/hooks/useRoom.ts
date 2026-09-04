import { useEffect, useState, useRef } from "react";
import socket from "../socket/socket";
import type { User } from "../types/user.ts"

export function useRoom({ roomId }: { roomId: string }) {
  const userId = localStorage.getItem("userId") ?? "";
  const [users, setUsers] = useState<User[]>([])
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const isHost = hostUserId !== null && hostUserId === userId;
  const [isPageLoading, setIsPageLoading] = useState(true);
  const hydratedRef = useRef(false);
  // const hasJoinedRef = useRef(false);


  useEffect(() => {
    if (!roomId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-room", { roomId });

    const handleRoomJoined = (data: {
      users: User[];
      hostUserId: string | null;
    }) => {
      setUsers(data.users ?? []);
      setHostUserId(data.hostUserId ?? null);
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        setIsPageLoading(false)
      }
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

    const handleRoomDeleted=()=>{
      alert("Room was deleted by host");
      window.location.href="/"
    }


    socket.on("kicked", handleKicked)
    socket.on("room-joined", handleRoomJoined);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("host-changed", handleHostChanged);
    socket.on("room:deleted", handleRoomDeleted)

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
  }, [roomId]);


  const leaveRoom = () => {
    socket.emit("leave-room", { roomId });
    window.location.href = "/"
  };

  const kickUser = (targetUserId: string) => {
    if (!isHost) return;

    socket.emit("kick-user", {
      roomId,
      targetUserId,
    });
  };

  const transferHost = (newHostId: string) => {
    if (!isHost) return;

    socket.emit("transfer-host", {
      roomId,
      newHostId,
    });
  };

  const deleteRoom = () => {
    socket.emit("room:delete", {
      roomId,
    });
  };
  return {
    users,
    hostUserId,
    isHost,
    leaveRoom,
    kickUser,
    transferHost,
    isPageLoading,
    deleteRoom,
  };

}
