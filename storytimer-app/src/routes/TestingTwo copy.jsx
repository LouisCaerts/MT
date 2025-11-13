import React, { useEffect, useMemo, useRef, useState } from "react";
import "../stylesheets/story.css"; // <-- new CSS file

// --- Script Loader (Vite) ---------------------------------------------------
const eagerScripts = import.meta.glob("../scripts/*.json", { eager: true });

function buildScriptIndex() {
    const map = {};
    for (const [path, mod] of Object.entries(eagerScripts)) {
        const id = path.split("/").pop().replace(/\.json$/, "");
        map[id] = mod.default ?? mod;
    }
    return map;
}

const SCRIPT_INDEX = buildScriptIndex();

// --- Types (informal JS doc) -----------------------------------------------
// Script shape: same as before (line / choice / action / end)

function evalCond(expr, flags) {
  if (!expr) return true;
  try {
        const replaced = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (name) => JSON.stringify(flags?.[name] ?? false));
        // eslint-disable-next-line no-new-func
        return Boolean(Function(`return (${replaced})`)());
    } catch {
        return false;
  }
}

// --- DialoguePlayer (CSS class based) --------------------------------------
export default function TestingTwo({
    scriptId,
    script,
    loadScript,
    initialFlags = {},
    onDone = () => {},
    clickToAdvance = true,
    typingSpeed = 12,
    allowEnterAdvance = true,
    className = "",
}) {
    const [loadedScript, setLoadedScript] = useState(() => script ?? (scriptId ? SCRIPT_INDEX[scriptId] : null));
    useEffect(() => {
        let cancelled = false;
        async function run() {
        if (script) { setLoadedScript(script); return; }
        if (loadScript && scriptId) {
            const s = await loadScript(scriptId);
            if (!cancelled) setLoadedScript(s ?? SCRIPT_INDEX[scriptId] ?? null);
            return;
        }
        if (scriptId) setLoadedScript(SCRIPT_INDEX[scriptId] ?? null);
        }
        run();
        return () => { cancelled = true; };
    }, [scriptId, script, loadScript]);

    if (!loadedScript) {
        return (
        <div className="dp-missing">
            No script provided. Pass <code>script</code>, <code>scriptId</code>, or <code>loadScript</code>.
        </div>
        );
    }

    const scriptData = loadedScript;
    const [flags, setFlags] = useState({ ...initialFlags });
    const [nodeId, setNodeId] = useState(scriptData.start);
    const node = scriptData.nodes[nodeId];

    const [typed, setTyped] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const fullTextRef = useRef("");
    const typeIdxRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        clearInterval(timerRef.current);
        setTyped("");
        typeIdxRef.current = 0;
        const text = node?.type === "line" ? node.text ?? "" : "";
        fullTextRef.current = text;

        if (node?.type === "line" && text) {
        setIsTyping(true);
        timerRef.current = setInterval(() => {
            const idx = typeIdxRef.current + 1;
            typeIdxRef.current = idx;
            setTyped(fullTextRef.current.slice(0, idx));
            if (idx >= fullTextRef.current.length) {
            clearInterval(timerRef.current);
            setIsTyping(false);
            }
        }, Math.max(0, typingSpeed));
        } else {
        setIsTyping(false);
        }

        return () => clearInterval(timerRef.current);
    }, [nodeId, typingSpeed]);

    useEffect(() => {
        if (!allowEnterAdvance) return;
        const handle = (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            advance();
        }
        };
        window.addEventListener("keydown", handle);
        return () => window.removeEventListener("keydown", handle);
    }, [allowEnterAdvance, isTyping, node]);

    function advance(nextOverride) {
        if (node?.type === "line") {
        if (isTyping) {
            clearInterval(timerRef.current);
            setTyped(fullTextRef.current);
            setIsTyping(false);
            return;
        }
        const next = nextOverride ?? node.next;
        if (!next) return;
        if (!scriptData.nodes[next]) return;
        setNodeId(next);
        return;
        }

        if (node?.type === "choice") return;

        if (node?.type === "action") {
        const newFlags = { ...flags, ...(node.set ?? {}) };
        setFlags(newFlags);
        const next = nextOverride ?? node.next;
        if (next && scriptData.nodes[next]) setNodeId(next);
        else onDone?.(newFlags);
        return;
        }

        if (node?.type === "end") onDone?.(flags);
    }

    function handleChoice(next) { setNodeId(next); }

    const visibleChoices = useMemo(() => {
        if (node?.type !== "choice") return [];
        return (node.choices ?? []).filter((c) => evalCond(c.cond, flags));
    }, [node, flags]);

    const canAdvance = node?.type === "line";

    return (
        <div
        className={`dp-root ${className}`}
        onClick={clickToAdvance && canAdvance ? () => advance() : undefined}
        role="group"
        aria-label="Dialogue Player"
        >
        {scriptData.title && (
            <div className="dp-title">{scriptData.title}</div>
        )}

        <div className="dp-frame">
            {node?.type === "line" && (
            <Bubble node={node} typed={typed} isTyping={isTyping} />
            )}

            {node?.type === "choice" && (
            <ChoicesCard prompt={node.prompt} choices={visibleChoices} onPick={handleChoice} />
            )}

            {node?.type === "end" && (
            <div className="dp-end">
                <div className="dp-end-title">✔ Goal Complete</div>
                <div className="dp-end-sub">Press Enter to close.</div>
            </div>
            )}
        </div>
        </div>
    );
}

function Bubble({ node, typed, isTyping }) {
    const right = node.side === "right";
    const wrapClass = right ? "dp-bwrap-right" : "dp-bwrap-left";
    const bubbleClass = right ? "dp-bubble-right" : "dp-bubble-left";
    return (
        <div className={wrapClass}>
        {!right && node.avatar && (
            <img src={node.avatar} alt="avatar" className="dp-avatar" />
        )}

        <div className="dp-bubble-col">
            {node.speaker && (
            <div className="dp-name">{node.speaker}</div>
            )}
            <div className={bubbleClass}>
            <p className="dp-text">
                {typed}
                {isTyping && <span className="dp-caret">▌</span>}
            </p>
            </div>
        </div>

        {right && node.avatar && (
            <img src={node.avatar} alt="avatar" className="dp-avatar" />
        )}
        </div>
    );
}

function ChoicesCard({ prompt, choices, onPick }) {
    return (
        <div className="dp-choice-card">
        {prompt && <div className="dp-choice-prompt">{prompt}</div>}
        <div className="dp-choice-list">
            {choices.map((c, i) => (
            <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onPick?.(c.next); }}
                className="dp-choice-btn"
            >
                {c.text}
            </button>
            ))}
        </div>
        </div>
    );
}
