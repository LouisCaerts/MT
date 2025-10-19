import '../stylesheets/Timer.css';

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

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

    // ring animation configuration
    const RING_SIZE = 180;
    const RING_STROKE = 10;

    const radius = (RING_SIZE - RING_STROKE) / 2;
    const circumference = 2 * Math.PI * radius;

    const remainingFrac = Math.max(0, Math.min(1, timeLeft / Math.max(1, duration * 1000)));
    const dashOffset = circumference * (1 - remainingFrac);

    return (
        <div className="timerContainer">
            <div className="timerRingWrapper">
                <svg className="timerRingSvg" width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                    <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} className="timerRingTrack" strokeWidth={RING_STROKE} />
                    <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} className="timerRingProgress" strokeWidth={RING_STROKE} strokeDasharray={circumference} strokeDashoffset={dashOffset} transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`} />
                </svg>
                <div className="timerRingLabel" aria-live="polite">{mm}:{ss}</div>
            </div>

            <div className="timerControls">
                {!isRunning && timeLeft === duration * 1000 && (
                    <button onClick={start} className="timerButton"><Play size={20} /></button>
                )}
                {isRunning && (
                    <button onClick={pause} className="timerButton"><Pause size={20} /></button>
                )}
                {!isRunning && timeLeft !== duration * 1000 && timeLeft > 0 && (
                    <button onClick={resume} className="timerButton"><Play size={20} /></button>
                )}
                <button onClick={reset} className="timerButton"><RotateCcw size={20} /></button>
            </div>
        </div>
    );
}
