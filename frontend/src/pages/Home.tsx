import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../config";

export default function Home(){
    const[roomId,setRoomId]=useState("");
  const [language, setLanguage] = useState("javascript");
    const [email,setEmail]=useState("");
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [isRegistering,setIsRegistering]=useState(false);
    const [showAuth,setShowAuth]=useState(false);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [error,setError]=useState("");
    const navigate=useNavigate();

    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    const createRoom = async () => {
      setError("");
      setIsCreatingRoom(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/rooms`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
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

    if (token) {
      return (
        <main className="wecode-page-background flex min-h-screen items-center justify-center px-5 py-10 text-slate-50">
          <section className="wecode-enter w-full max-w-lg rounded-[28px] border border-slate-700/70 bg-[var(--brand-bg-soft)]/95 p-7 shadow-[0_30px_80px_rgba(2,6,23,0.5)] backdrop-blur-sm sm:p-9">
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">weCode</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-50">Welcome back{storedUsername ? `, ${storedUsername}` : ""}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">Join your team or start a new collaborative coding session.</p>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-slate-300" htmlFor="room-id">Join an existing room</label>
              <input id="room-id" placeholder="Enter room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="wecode-field rounded-2xl border px-4 py-3 outline-none placeholder:text-slate-400 transition focus:border-cyan-500/60" />
              <label className="text-sm font-medium text-slate-300" htmlFor="language">New room language</label>
              <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)} className="wecode-button wecode-button--ghost w-full justify-between px-4 text-left">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button onClick={() => { if (roomId.trim()) navigate(`/room/${roomId.trim()}`) }} disabled={!roomId.trim()} className="wecode-button wecode-button--chip w-full disabled:cursor-not-allowed disabled:opacity-40">Join room</button>
                <button onClick={createRoom} disabled={isCreatingRoom} className="wecode-button wecode-button--primary w-full disabled:cursor-not-allowed disabled:opacity-60">
                  {isCreatingRoom ? "Creating..." : "Create room"}
                </button>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-sm text-slate-400 transition hover:text-white">Sign out</button>
              {error && <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
            </div>
          </section>
        </main>
      );
    }

    const openAuth = (registering: boolean) => {
      setIsRegistering(registering);
      setError("");
      setShowAuth(true);
    };

    return (
      <main className="wecode-landing min-h-screen overflow-hidden text-slate-100 selection:bg-cyan-300/30">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-2.5" aria-label="WeCode home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-emerald-400 text-sm font-black text-slate-950">W</span>
            <span className="text-sm font-semibold tracking-tight text-white">weCode</span>
          </a>
          <nav className="flex items-center gap-3 sm:gap-7" aria-label="Main navigation">
            <a href="#features" className="hidden text-sm text-slate-400 transition hover:text-white sm:inline">Features</a>
            <a href="#how-it-works" className="hidden text-sm text-slate-400 transition hover:text-white sm:inline">How it works</a>
            <button onClick={() => openAuth(false)} className="text-sm font-medium text-slate-300 transition hover:text-white">Sign in</button>
            <button onClick={() => openAuth(true)} className="wecode-button wecode-button--primary wecode-button--compact">Get started</button>
          </nav>
        </header>

        <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-16 pt-12 text-center sm:px-8 sm:pt-16">
          <div className="wecode-enter">
            <div className="wecode-surface rounded-full border px-3 py-1.5 mb-6 inline-flex items-center gap-2 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              A shared space for better coding sessions
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl">
              Think together.
              <span className="block bg-gradient-to-r from-cyan-200 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">Code in sync.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
              A collaborative coding room for building, learning, and solving problems together — with live editing, thoughtful code comments, and instant runs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={() => openAuth(true)} className="wecode-button wecode-button--primary h-12 min-w-40 px-6">
                Start coding together <span aria-hidden="true">→</span>
              </button>
              <a href="#features" className="inline-flex h-12 items-center rounded-full border border-slate-700 px-6 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white">
                Explore features
              </a>
            </div>
          </div>

          <div className="relative mt-14 w-full max-w-5xl sm:mt-20">
            <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-emerald-500/10 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-[var(--brand-bg-soft)] text-left shadow-[0_32px_100px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between border-b border-slate-700/70 bg-[var(--brand-bg-soft)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-3 text-xs text-slate-400">pairing-room / solution.js</span>
                </div>
                <span className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300 sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 2 people coding
                </span>
              </div>
              <div className="grid min-h-[280px] md:grid-cols-[1fr_230px]">
                <div className="overflow-hidden p-5 font-mono text-xs leading-7 sm:p-8 sm:text-sm">
                  <div className="flex gap-5 text-slate-600"><span>1</span><span><span className="text-fuchsia-300">function</span> <span className="text-sky-300">findPair</span>(numbers, target) {"{"}</span></div>
                  <div className="flex gap-5 text-slate-600"><span>2</span><span className="pl-5"><span className="text-fuchsia-300">const</span> seen = <span className="text-amber-200">new</span> Map();</span></div>
                  <div className="flex gap-5 rounded bg-cyan-400/5 text-slate-600"><span>3</span><span className="pl-5"><span className="text-fuchsia-300">for</span> (<span className="text-fuchsia-300">let</span> i = 0; i &lt; numbers.length; i++) {"{"}</span></div>
                  <div className="flex gap-5 text-slate-600"><span>4</span><span className="pl-10"><span className="text-fuchsia-300">const</span> need = target - numbers[i];</span></div>
                  <div className="flex gap-5 text-slate-600"><span>5</span><span className="pl-10"><span className="text-fuchsia-300">if</span> (seen.has(need)) <span className="text-emerald-300">return</span> [seen.get(need), i];</span></div>
                  <div className="flex gap-5 text-slate-600"><span>6</span><span className="pl-10">seen.set(numbers[i], i);</span></div>
                  <div className="flex gap-5 text-slate-600"><span>7</span><span className="pl-5">{"}"}</span></div>
                  <div className="flex gap-5 text-slate-600"><span>8</span><span>{"}"}</span></div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 font-sans text-[11px] text-cyan-200">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-300 text-[9px] font-bold text-slate-950">A</span>
                    Nice — this keeps the lookup linear.
                  </div>
                </div>
                <aside className="hidden border-l border-slate-700/70 bg-[var(--brand-bg)] p-4 md:block">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200">In this room</span>
                    <span className="text-[10px] text-slate-500">2 online</span>
                  </div>
                  <div className="space-y-3">
                    <div className="wecode-surface flex items-center gap-2 rounded-xl border p-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-semibold text-cyan-200">A</span>
                      <span className="text-xs text-slate-200">Alex <span className="text-slate-500">· host</span></span>
                    </div>
                    <div className="wecode-surface flex items-center gap-2 rounded-xl border p-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-400/20 text-[10px] font-semibold text-violet-200">S</span>
                      <span className="text-xs text-slate-200">Sam</span>
                    </div>
                  </div>
                  <div className="wecode-surface mt-6 rounded-xl border p-3">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-medium text-slate-300"><span className="text-cyan-300">●</span> Comment · line 3</div>
                    <p className="text-[10px] leading-5 text-slate-400">Could we add a quick test for duplicate values?</p>
                  </div>
                  <div className="mt-3 rounded-lg bg-emerald-400/10 px-3 py-2 font-mono text-[10px] text-emerald-300">✓ Run completed</div>
                </aside>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">One room. Shared code, comments, and execution.</p>
          </div>
        </section>

        <section id="features" className="border-y border-slate-700/60 bg-[var(--brand-bg-soft)]/35">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Built for the flow</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Less setup. More solving.</h2>
              <p className="mt-4 leading-7 text-slate-400">Everything your group needs to turn a shared idea into working code.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: "↗", title: "Code together live", body: "See edits as they happen and work through a problem in the same shared editor." },
                { icon: "⌘", title: "Discuss in context", body: "Leave comments on exact lines, reply in threads, and resolve feedback as you go." },
                { icon: "▶", title: "Run ideas quickly", body: "Choose a supported language, provide input, and share execution results with the room." },
              ].map((feature) => (
                <article key={feature.title} className="wecode-surface-raised wecode-surface-hover rounded-2xl border p-6 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-slate-600">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-lg text-cyan-200">{feature.icon}</span>
                  <h3 className="mt-5 font-semibold text-slate-100">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Simple by design</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">From idea to room in seconds.</h2>
              <p className="mt-4 leading-7 text-slate-400">No project setup or configuration to slow you down. Create a room, invite your teammate, and start collaborating.</p>
              <button onClick={() => openAuth(true)} className="wecode-button wecode-button--primary mt-7">Create your first room <span aria-hidden="true">→</span></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { number: "01", title: "Create", detail: "Pick a language and open a room." },
                { number: "02", title: "Invite", detail: "Share a room link with your team." },
                { number: "03", title: "Collaborate", detail: "Edit, comment, and run code together." },
              ].map((step) => (
                <div key={step.number} className="wecode-surface rounded-2xl border p-5">
                  <span className="font-mono text-xs text-cyan-300">{step.number}</span>
                  <h3 className="mt-5 font-semibold text-slate-100">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-800/70 px-5 py-6 text-center text-xs text-slate-500">
          <span>weCode</span> <span className="mx-2">·</span> Make good ideas work together.
        </footer>

        {showAuth && (
          <div className="wecode-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 backdrop-blur-sm" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAuth(false);
          }}>
            <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="wecode-enter wecode-dialog w-full max-w-md rounded-[24px] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">weCode account</p>
                  <h2 id="auth-title" className="text-2xl font-semibold text-white">{isRegistering ? "Create your account" : "Welcome back"}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{isRegistering ? "Start collaborating with your team." : "Sign in to continue to your rooms."}</p>
                </div>
                <button onClick={() => setShowAuth(false)} aria-label="Close sign in dialog" className="rounded-lg px-2 py-1 text-xl text-slate-400 transition hover:bg-slate-800 hover:text-white">×</button>
              </div>
              <div className="flex flex-col gap-4">
                {isRegistering && <input autoComplete="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="wecode-field rounded-xl border px-4 py-3 outline-none placeholder:text-slate-400 transition focus:border-cyan-500/60" />}
                <input type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="wecode-field rounded-xl border px-4 py-3 outline-none placeholder:text-slate-400 transition focus:border-cyan-500/60" />
                <input type="password" autoComplete={isRegistering ? "new-password" : "current-password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="wecode-field rounded-xl border px-4 py-3 outline-none placeholder:text-slate-400 transition focus:border-cyan-500/60" />
                <button onClick={handleAuth} className="wecode-button wecode-button--primary w-full">{isRegistering ? "Create account" : "Sign in"}</button>
                {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
                <p className="text-center text-sm text-slate-400">
                  {isRegistering ? "Already have an account?" : "New to weCode?"}{" "}
                  <button onClick={() => { setIsRegistering((value) => !value); setError(""); }} className="font-medium text-cyan-300 transition hover:text-cyan-200">
                    {isRegistering ? "Sign in" : "Create an account"}
                  </button>
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    );
}