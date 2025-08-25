import { useState, useEffect } from "react";

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false); // new state

  useEffect(() => {
    if (paused) return; // if paused, don't start interval

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);


    return () => clearInterval(interval);
  }, [paused]); // re-run effect when "paused" changes

  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div>
      <h2>{hours}:{minutes}:{secs}</h2>
      <button onClick={() => setPaused(!paused)}>
        {paused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}
