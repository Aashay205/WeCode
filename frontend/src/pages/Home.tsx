import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Home(){
    const[roomId,setRoomId]=useState("");
    const [username,setUsername]=useState("")
    const navigate=useNavigate();

    const existingUserId = localStorage.getItem("userId");
    const userId=existingUserId ?? crypto.randomUUID();
    localStorage.setItem("userId",userId);

    const handleJoin=()=>{
         if (!roomId || !username) return;

    navigate(`/room/${roomId}`, {
      state: { username },
    });
    }

    return (
         <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl text-white font-bold m-4">Join a Room</h2>

      <div className="flex flex-col gap-10 text-white color">
        <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      <input
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="border px-3 py-2 rounded"
      />

      <button
        onClick={handleJoin}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Join
      </button>
      </div>
      
    </div>
    )
}