import '../stylesheets/Timer.css';

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

//helpers
const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export default function Timer({ duration = 90,  autoStart = true, onComplete }) 
{
    // states
    const [isRunning, setIsRunning] = useState(autoStart);
    const [timeLeft, setTimeLeft]   = useState(duration * 1000);

    // declarations
    const startRef          = useRef(null);
    const pausedStartRef    = useRef(null);
    const pausedMsRef       = useRef(0);

    // session bookkeeping
    const sessionIdRef      = useRef(null);   // active DB session id
    const finishedRef       = useRef(false);  // prevent double finish

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

    // helpers to finish current session in db
    const getActiveMs = () => {
        const left = computeTimeLeft();
        return Math.max(0, (duration * 1000) - left);
    };
    const finishCurrent = async (outcome) => {
        if (!sessionIdRef.current || finishedRef.current) return;
        finishedRef.current = true;

        try {
            const activeMs = getActiveMs(); // excludes pauses
            const actualSec = Math.round(activeMs / 1000);

            // 1) finish the session in the sessions table
            await window.sessions.finish({
                id: sessionIdRef.current,
                outcome,
                duration_actual_sec: actualSec,
            });

            // 2) if the session was COMPLETED, add its focused time to today's day row
            if (outcome === 'completed' && actualSec > 0 && window.days?.addFocus) {
                const minutes = actualSec / 60; // days.focused_min is in minutes
                const date = todayISO();

                try {
                    await window.days.addFocus({ date, minutes });
                } catch (e) {
                    console.error('update days focused_min failed', e);
                }
            }

        } catch (e) {
            console.error('finish session failed', e);
        } finally {
            sessionIdRef.current = null;
        }
    };


    // listen for main process timer completion
    useEffect(() => {
        const unsubscribe = window.timerBridge.onComplete(async () => {
            await finishCurrent('completed');
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
                (async () => {
                    await finishCurrent('completed');
                    setIsRunning(false);
                    cancelMainDeadline();
                    onComplete?.();
                })();
            }
        }
    }, [duration]);

    // running session on unmount -> crash in db
    useEffect(() => {
        return () => {
            if (sessionIdRef.current && !finishedRef.current) {
                window.sessions.finish({ id: sessionIdRef.current, outcome: 'crash' })  // fire-and-forget; cannot await in unmount
                  .catch(err => console.error('finish crash failed', err));
                sessionIdRef.current = null;
                finishedRef.current = true;
            }
        };
    }, []);

    // start timer
    const start = async () => {
        const startingFresh = (startRef.current == null);
        if (startingFresh) {
            try {
                const { id } = await window.sessions.start({
                    duration_target_sec: Math.round(duration)
                });
                sessionIdRef.current = id;
                finishedRef.current = false;
            } catch (e) {
                console.error('start session failed', e);
            }
        }

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
    const reset = async () => {
        // reset session before finish -> 'cancelled' in db
        if (sessionIdRef.current && !finishedRef.current) {
            await finishCurrent('cancelled');
        }

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
                {/* <button onClick={reset} className="timerButton"><RotateCcw size={20} /></button> */}
            </div>
        </div>
    );
}
