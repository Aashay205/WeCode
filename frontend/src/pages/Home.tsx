import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function Home(){
    const[roomId,setRoomId]=useState("");
  const [language, setLanguage] = useState("javascript");
    const [email,setEmail]=useState("");
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [isRegistering,setIsRegistering]=useState(false);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [error,setError]=useState("");
    const navigate=useNavigate();

    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    const createRoom = async () => {
      setError("");
      setIsCreatingRoom(true);
      try {
        const response = await fetch("http://localhost:3000/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ language }),
        });
        const data = await response.json() as { error?: string; roomId?: string };
        if (!response.ok || !data.roomId) {
          setError(data.error ?? "Unable to create room");
          return;
        }
        navigate(`/room/${data.roomId}`);
      } catch {
        setError("Unable to connect to the server");
      } finally {
        setIsCreatingRoom(false);
      }
    };

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
      <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:flex sm:items-center sm:justify-center">
        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl shadow-black/30 sm:p-9">
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">weCode</p>
            <h2 className="text-3xl font-bold tracking-tight">{token ? "Join a room" : isRegistering ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-2 text-sm text-slate-400">{token ? "Collaborate, comment, and run code together." : "Sign in to start coding with your team."}</p>
          </div>

          <div className="flex flex-col gap-4">
            {!token && isRegistering && <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />}
            {!token && <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />}
            {!token && <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />}

            {token && <>
              <p className="text-sm text-slate-400">Signed in as <span className="font-semibold text-white">{storedUsername}</span></p>
              <label className="text-sm font-medium text-slate-300" htmlFor="room-id">Join an existing room</label>
              <input id="room-id" placeholder="Enter room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />
              <label className="text-sm font-medium text-slate-300" htmlFor="language">New room language</label>
              <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)} className="cursor-pointer rounded-lg border border-slate-600 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </>}

            {token ? <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <button onClick={() => { if (roomId.trim()) navigate(`/room/${roomId.trim()}`) }} disabled={!roomId.trim()} className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">Join room</button>
              <button onClick={createRoom} disabled={isCreatingRoom} className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300">
                {isCreatingRoom ? "Creating..." : "Create room"}
              </button>
            </div> : <button onClick={handleAuth} className="rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">{isRegistering ? "Create account" : "Sign in"}</button>}
            {!token && <button onClick={() => setIsRegistering((value) => !value)} className="text-sm text-slate-400 transition hover:text-white">{isRegistering ? "Already have an account? Sign in" : "Create an account"}</button>}
            {token && <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-sm text-slate-400 transition hover:text-white">Sign out</button>}
            {error && <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}
          </div>
        </section>
      </main>
    )
}