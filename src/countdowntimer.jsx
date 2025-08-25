import { useState, useEffect, useRef } from "react";
import chimeUrl from "./assets/guitar-chime.mp3"; // your file

function pad2(n) { return String(n).padStart(2, "0"); }
function formatHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export default function CountdownTimer() {
  const [remaining, setRemaining] = useState(0);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [paused, setPaused] = useState(true);
  const [autoRestart, setAutoRestart] = useState(false);
  const [resting, setResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(5); // NEW: configurable rest

  const [h, setH] = useState("0");
  const [m, setM] = useState("0");
  const [s, setS] = useState("0");

  const audioRef = useRef(null);
  useEffect(() => {
    const a = new Audio(chimeUrl);
    a.preload = "auto";
    a.volume = 0.9;
    audioRef.current = a;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // tick while running
  useEffect(() => {
    if (paused || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, remaining]);

  // handle hitting zero (main or rest)
  useEffect(() => {
    if (remaining === 0 && !paused) {
      // chime whenever a phase ends
      const a = audioRef.current;
      if (a) { a.currentTime = 0; a.play().catch(() => {}); }

      if (resting) {
        // rest just finished → start main round
        setResting(false);
        if (initialSeconds > 0) setRemaining(initialSeconds);
        else setPaused(true);
        return;
      }

      // main round finished
      if (autoRestart && initialSeconds > 0) {
        if (restSeconds > 0) {
          setResting(true);
          setRemaining(restSeconds);
        } else {
          // no rest → immediate restart
          setRemaining(initialSeconds);
        }
      } else {
        setPaused(true);
      }
    }
  }, [remaining, paused, resting, autoRestart, initialSeconds, restSeconds]);

  function parseIntSafe(v) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? Math.max(n, 0) : 0;
  }

  function handleSetTime() {
    const hours = parseIntSafe(h);
    const mins  = parseIntSafe(m);
    const secs  = parseIntSafe(s);
    const total = hours * 3600 + mins * 60 + secs;
    setInitialSeconds(total);
    setRemaining(total);
    setPaused(true);
    setResting(false);
  }

  function handleStartPause() {
    // allow start if we have a configured time, even if remaining is 0
    const canStart = remaining > 0 || initialSeconds > 0;
    if (!canStart) return;
    if (remaining === 0 && initialSeconds > 0) {
      // resume from initial if user hits Start at 0
      setRemaining(initialSeconds);
    }
    setPaused((p) => !p);
  }

  function handleReset() {
    setRemaining(initialSeconds);
    setPaused(true);
    setResting(false);
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: 520 }}>
      <div style={{ fontSize: "2.25rem", fontWeight: 700, textAlign: "center" }}>
        {resting ? `Rest: ${formatHMS(remaining)}` : formatHMS(remaining)}
      </div>

      {/* Time inputs */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <label>
          H
          <input type="number" min="0" value={h} onChange={(e) => setH(e.target.value)} style={{ width: 64, marginLeft: 6 }} />
        </label>
        <label>
          M
          <input type="number" min="0" value={m} onChange={(e) => setM(e.target.value)} style={{ width: 64, marginLeft: 6 }} />
        </label>
        <label>
          S
          <input type="number" min="0" value={s} onChange={(e) => setS(e.target.value)} style={{ width: 64, marginLeft: 6 }} />
        </label>
        <button onClick={handleSetTime} style={{ marginLeft: "auto" }}>Set</button>
      </div>

      {/* Controls + options */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={handleStartPause} disabled={remaining === 0 && initialSeconds === 0 && paused}>
          {paused ? "Start" : "Pause"}
        </button>
        <button onClick={handleReset} disabled={initialSeconds === remaining && !resting}>Reset</button>
        <button onClick={() => { setRemaining(0); setPaused(true); setResting(false); }}>Clear</button>

        <label style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={autoRestart}
            onChange={(e) => setAutoRestart(e.target.checked)}
          />
          Auto-restart
        </label>

        {/* NEW: Rest seconds */}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          Rest (sec)
          <input
            type="number"
            min="0"
            max="600"
            value={restSeconds}
            onChange={(e) => setRestSeconds(parseIntSafe(e.target.value))}
            style={{ width: 72 }}
          />
        </label>
      </div>
    </div>
  );
}
