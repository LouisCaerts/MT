import '../stylesheets/Timer.css';

import { useEffect, useRef, useState } from "react";

export default function Timer({ duration = 90,  autoStart = false, onComplete }) 
{
    // states
    const [isRunning, setIsRunning] = useState(autoStart);
    const [timeLeft, setTimeLeft]   = useState(duration * 1000);

    // declarations
    const startRef          = useRef(null);
    const pausedStartRef    = useRef(null);
    const pausedMsRef       = useRef(0);

    // calculate remaining time on timer
    const computeTimeLeft = (now) => {
        if (startRef.current == null) return (duration * 1000);
        const base = now ?? performance.now();
        const anchor = pausedStartRef.current ?? base;
        const elapsed = anchor - startRef.current - pausedMsRef.current;
        return Math.max(0, (duration * 1000) - elapsed);
    };

    // constantly update time left, clean up when unmounted
    useEffect(() => {
        let raf;
        const tick = () => {
            if (startRef.current != null) setTimeLeft(computeTimeLeft());
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [duration]);

    // listen for main process timer completion
    useEffect(() => {
        const unsubscribe = window.timerBridge.onComplete(() => {
            setIsRunning(false);
            setTimeLeft(0);
            onComplete?.();
        });
        return unsubscribe;
    }, [onComplete]);

    // arm main process timer
    const armMainDeadline = () => {
        const leftNow = computeTimeLeft();
        const deadline = Date.now() + leftNow;
        window.timerBridge.arm(deadline);
    };

    // cancel main process timer
    const cancelMainDeadline = () => window.timerBridge.cancel();

    // updates and/or rearms timer when duration is changed
    useEffect(() => {
        if (startRef.current == null) {
            setTimeLeft(duration * 1000);
            if (autoStart) start();
        } 
        else {
            const left = computeTimeLeft();
            setTimeLeft(left);
            if (isRunning) armMainDeadline();
            if (left === 0) {
                setIsRunning(false);
                cancelMainDeadline();
                onComplete?.();
            }
        }
    }, [duration]);

    // start timer
    const start = () => {
        startRef.current = performance.now() - ((duration * 1000) - timeLeft);
        pausedMsRef.current = 0;
        pausedStartRef.current = null;
        setIsRunning(true);
        armMainDeadline();
    };

    // pause timer
    const pause = () => {
        if (!isRunning) return;
        pausedStartRef.current = performance.now();
        setIsRunning(false);
        cancelMainDeadline();
    };

    // resume timer
    const resume = () => {
        if (pausedStartRef.current != null) {
            pausedMsRef.current += performance.now() - pausedStartRef.current;
            pausedStartRef.current = null;
        }
        setIsRunning(true);
        armMainDeadline();
    };

    // reset timer
    const reset = () => {
        setIsRunning(false);
        setTimeLeft(duration * 1000);
        startRef.current = null;
        pausedStartRef.current = null;
        pausedMsRef.current = 0;
        cancelMainDeadline();
    };

    const mm = Math.floor(timeLeft / 60000);
    const ss = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, "0");

    return (
        <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{mm}:{ss}</div>
        <button onClick={start}>Start</button>{" "}
        <button onClick={pause}>Pause</button>{" "}
        <button onClick={resume}>Resume</button>{" "}
        <button onClick={reset}>Reset</button>
        </div>
    );
}