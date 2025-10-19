import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * CircularCountdownTimer
 * - Smooth, raf-based countdown that stays accurate (no setInterval drift)
 * - SVG ring visual that shrinks as time elapses
 * - Shows mm:ss in the center
 * - Start / Pause / Resume / Reset controls (optional)
 *
 * Works in any React app (Vite/Electron friendly). No dependencies.
 */
export default function CircularCountdownTimer({
  duration = 90, // seconds
  autoStart = false,
  size = 180, // px
  strokeWidth = 10, // px
  trackColor = "#E5E7EB", // neutral-200
  progressColor = "#3B82F6", // blue-500
  onComplete,
}) {
  // ----- timing state -----
  const totalMs = duration * 1000;
  const [isRunning, setIsRunning] = useState(autoStart);
  const [timeLeftMs, setTimeLeftMs] = useState(totalMs);

  // Refs to avoid re-renders on every frame
  const startEpochRef = useRef(null); // ms timestamp when run started
  const pausedAccumRef = useRef(0); // total ms spent paused across cycles
  const pauseStartedRef = useRef(null); // when current pause began
  const rafRef = useRef(null);
  const completedRef = useRef(false);

  // ----- SVG geometry -----
  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  // Clamp helper
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // Format mm:ss
  const fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const mPart = Math.floor(s / 60).toString();
    const sPart = (s % 60).toString().padStart(2, "0");
    return `${mPart}:${sPart}`;
  };

  // Core animation loop using requestAnimationFrame for smoothness + accuracy
  const tick = useCallback((now) => {
    if (!isRunning || startEpochRef.current == null) return;

    const elapsedActive = now - startEpochRef.current - pausedAccumRef.current; // ms actually counting down
    const remaining = Math.max(0, totalMs - elapsedActive);

    setTimeLeftMs(remaining);

    if (remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      setIsRunning(false);
      if (typeof onComplete === "function") onComplete();
      return; // stop ticking
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, totalMs, onComplete]);

  // Kick off / stop RAF on running changes
  useEffect(() => {
    if (isRunning) {
      // initialize start time if needed
      if (startEpochRef.current == null) {
        startEpochRef.current = performance.now();
      }
      // if we were paused, add this pause to the accumulator
      if (pauseStartedRef.current != null) {
        pausedAccumRef.current += performance.now() - pauseStartedRef.current;
        pauseStartedRef.current = null;
      }
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, tick]);

  // Auto-start behavior on mount when requested
  useEffect(() => {
    if (autoStart) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- controls -----
  const start = useCallback(() => {
    // reset all timing refs and begin
    startEpochRef.current = performance.now();
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;
    completedRef.current = false;
    setTimeLeftMs(totalMs);
    setIsRunning(true);
  }, [totalMs]);

  const pause = useCallback(() => {
    if (!isRunning || pauseStartedRef.current != null) return;
    pauseStartedRef.current = performance.now();
    setIsRunning(false);
  }, [isRunning]);

  const resume = useCallback(() => {
    if (isRunning || startEpochRef.current == null) return;
    // add the paused duration to the accumulator and continue
    if (pauseStartedRef.current != null) {
      pausedAccumRef.current += performance.now() - pauseStartedRef.current;
      pauseStartedRef.current = null;
    }
    setIsRunning(true);
  }, [isRunning]);

  const reset = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startEpochRef.current = null;
    pausedAccumRef.current = 0;
    pauseStartedRef.current = null;
    completedRef.current = false;
    setTimeLeftMs(totalMs);
    setIsRunning(false);
  }, [totalMs]);

  // ----- progress math -----
  const remainingFrac = clamp01(timeLeftMs / totalMs); // 1 → full, 0 → empty
  const dashOffset = circumference * (1 - remainingFrac); // grow from 0 to circumference

  return (
    <div style={{ width: size, userSelect: "none" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress (uses dash offset) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`} // start at top
          />
        </svg>

        {/* Time label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell",
            fontWeight: 600,
            fontSize: Math.max(16, size * 0.16),
          }}
          aria-live="polite"
        >
          {fmt(timeLeftMs)}
        </div>
      </div>

      {/* Controls — optional. Remove if you're wiring external buttons. */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {!isRunning && timeLeftMs === totalMs && (
          <button onClick={start}>Start</button>
        )}
        {isRunning && <button onClick={pause}>Pause</button>}
        {!isRunning && timeLeftMs !== totalMs && timeLeftMs > 0 && (
          <button onClick={resume}>Resume</button>
        )}
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

/**
 * Usage
 * -------
 * import CircularCountdownTimer from "./CircularCountdownTimer";
 *
 * export default function Example() {
 *   return (
 *     <div style={{ padding: 24 }}>
 *       <CircularCountdownTimer duration={120} autoStart />
 *     </div>
 *   );
 * }
 */
