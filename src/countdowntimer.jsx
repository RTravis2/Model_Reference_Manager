import { useState, useEffect, useRef } from "react";
import chimeUrl from "./assets/guitar-chime.mp3"; // <- your file

function pad2(n) {
  return String(n).padStart(2, "0");
}
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

  const [h, setH] = useState("0");
  const [m, setM] = useState("0");
  const [s, setS] = useState("0");

  // one audio instance for the component lifetime
  const audioRef = useRef(null);
  useEffect(() => {
    const a = new Audio(chimeUrl);
    a.preload = "auto";
    a.volume = 0.9; // tweak if you want
    audioRef.current = a;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // tick every second while running
  useEffect(() => {
    if (paused || remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) return 0; // stop at zero
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [paused, remaining]);

  // when we hit zero, play chime and auto-pause
  useEffect(() => {
    if (remaining === 0 && !paused) {
      setPaused(true);
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play().catch(() => {
          // Some browsers require a user gesture; Start button usually satisfies this.
        });
      }
    }
  }, [remaining, paused]);

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
    setPaused(true); // user presses Start to begin
  }

  function handleStartPause() {
    if (remaining <= 0) return; // nothing to run
    setPaused((p) => !p);
  }

  function handleReset() {
    setRemaining(initialSeconds);
    setPaused(true);
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: 360 }}>
      <div style={{ fontSize: "2.25rem", fontWeight: 700, textAlign: "center" }}>
        {formatHMS(remaining)}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={handleStartPause} disabled={remaining === 0 && paused}>
          {paused ? "Start" : "Pause"}
        </button>
        <button onClick={handleReset} disabled={initialSeconds === remaining}>Reset</button>
        <button onClick={() => { setRemaining(0); setPaused(true); }}>Clear</button>
      </div>
    </div>
  );
}
