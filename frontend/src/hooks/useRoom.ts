import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket/socket";
import type { User } from "../types/user.ts"

export function useRoom({ roomId }: { roomId: string }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId") ?? "";
  const [users, setUsers] = useState<User[]>([])
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const isHost = hostUserId !== null && hostUserId === userId;
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const hydratedRef = useRef(false);
  const joinedSocketIdRef = useRef<string | null>(null);


  useEffect(() => {
    if (!roomId) return;

    const handleRoomJoined = (data: {
      users: User[];
      hostUserId: string | null;
    }) => {
      setUsers(data.users ?? []);
      setHostUserId(data.hostUserId ?? null);
      setHasJoinedRoom(true);
      setRoomError(null);
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        setIsPageLoading(false);
      }
    };

    const joinRoom = () => {
      if (!socket.id) return;
      const joinKey = `${socket.id}:${roomId}`;
      if (joinedSocketIdRef.current === joinKey) return;
      joinedSocketIdRef.current = joinKey;
      socket.emit("join-room", { roomId });
    };

    const handleConnect = () => {
      setRoomError(null);
      joinRoom();
    };

    const handleConnectError = (error: Error) => {
      setRoomError(`Unable to connect to the collaboration server: ${error.message}`);
      setIsPageLoading(false);
    };

    const handleDisconnect = (reason: string) => {
      if (reason !== "io client disconnect") {
        setRoomError("Connection lost. Reconnecting to the room...");
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
      navigate("/", { replace: true });
    }

    const handleJoinDenied = ({ reason }: { reason: string }) => {
      joinedSocketIdRef.current = null;
      setRoomError(reason);
      setIsPageLoading(false);
    };

    socket.auth = { token: localStorage.getItem("token") };
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("kicked", handleKicked)
    socket.on("room-joined", handleRoomJoined);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("host-changed", handleHostChanged);
    socket.on("room:deleted", handleRoomDeleted)
    socket.on("join-denied", handleJoinDenied);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("kicked", handleKicked);
      socket.off("room-joined", handleRoomJoined);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("host-changed", handleHostChanged);
      socket.off("room:deleted", handleRoomDeleted);
      socket.off("join-denied", handleJoinDenied);
    };
  }, [navigate, roomId]);

  const retryRoomJoin = () => {
    setRoomError(null);
    setIsPageLoading(true);
    joinedSocketIdRef.current = null;
    if (socket.connected) {
      joinedSocketIdRef.current = `${socket.id}:${roomId}`;
      socket.emit("join-room", { roomId });
    } else {
      socket.connect();
    }
  };

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
    roomError,
    hasJoinedRoom,
    retryRoomJoin,
    deleteRoom,
  };

}
