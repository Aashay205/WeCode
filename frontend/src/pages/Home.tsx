import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Home(){
    const[roomId,setRoomId]=useState("");
    const [email,setEmail]=useState("");
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [isRegistering,setIsRegistering]=useState(false);
    const [error,setError]=useState("");
    const navigate=useNavigate();

    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    const handleAuth = async () => {
      setError("");
      const endpoint = isRegistering ? "register" : "login";
      const body = isRegistering ? { email, username, password } : { email, password };
      const response = await fetch(`http://localhost:3000/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string; token?: string; user?: { username: string; userId: string } };
      if (!response.ok || !data.token || !data.user) {
        setError(data.error ?? "Authentication failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("userId", data.user.userId);
      window.location.reload();
    };

    return (
         <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl text-white font-bold m-4">{token ? "Join a Room" : isRegistering ? "Create Account" : "Sign In"}</h2>

      <div className="flex flex-col gap-10 text-white color">
        {!token && isRegistering && <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="border px-3 py-2 rounded" />}
        {!token && <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border px-3 py-2 rounded" />}
        {!token && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border px-3 py-2 rounded" />}

        {token && <><p>Signed in as {storedUsername}</p><input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="border px-3 py-2 rounded" /></>}

      {token ? <button onClick={() => { if (roomId) navigate(`/room/${roomId}`) }} className="bg-blue-600 text-white px-4 py-2 rounded">Join</button> : <button onClick={handleAuth} className="bg-blue-600 text-white px-4 py-2 rounded">{isRegistering ? "Register" : "Sign In"}</button>}
      {!token && <button onClick={() => setIsRegistering((value) => !value)}>{isRegistering ? "Already have an account? Sign in" : "Create an account"}</button>}
      {token && <button onClick={() => { localStorage.clear(); window.location.reload(); }}>Sign out</button>}
      {error && <p className="text-red-400">{error}</p>}
      </div>
      
    </div>
    )
}