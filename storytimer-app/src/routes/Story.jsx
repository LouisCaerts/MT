import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "../stylesheets/story.css";

/* script importer */
const lazyScripts = import.meta.glob("../scripts/*.json");
async function loadScript(id) {
    const path = `../scripts/${id}.json`;
    const importer = lazyScripts[path];
    if (!importer) throw new Error(`Script not found: ${id}`);
    const mod = await importer();
    return mod.default ?? mod;
}

/* avatars importer */
const avatarMap = import.meta.glob("../images/avatars/*.{png,jpg,jpeg,webp,svg}", {
    eager: true,
    query: "?url",
    import: "default"
});

/* avatars resolver */
function resolveAvatar(input) {
    if (!input) return "";
    if (input.startsWith("/")) return input;
    const name = input.split("/").pop();
    for (const [key, url] of Object.entries(avatarMap)) {
        if (key.endsWith("/" + name)) return url;
    }
    return "";
}

/* evaluate condition visibility */
function evalCond(expr, flags) {
    if (!expr) return true;
    try {
        const safe = expr.replace(/([a-zA-Z_][a-zA-Z0-9_]*)/g, (name) => JSON.stringify(flags?.[name] ?? false));
        return !!Function(`return (${safe})`)();
    } catch {
        return false;
    }
}

function injectUsernameIntoScript(script, username) {
    const s = JSON.parse(JSON.stringify(script)); // clone

    function sub(str) {
        return typeof str === "string"
            ? str.replace(/\[username\]/g, username)
            : str;
    }

    if (s.title) s.title = sub(s.title);

    for (const node of Object.values(s.nodes || {})) {
        if (node.text) node.text = sub(node.text);
        if (node.speaker) node.speaker = sub(node.speaker);
        if (node.prompt) node.prompt = sub(node.prompt);
        if (node.choices) {
            node.choices = node.choices.map(c => ({
                ...c,
                text: sub(c.text)
            }));
        }
    }

    return s;
}


export default function Story({ scriptId = "none", onDone = () => {}, initialFlags = {} }) {
    // 1) state hoojks
    const [script, setScript] = useState(null);
    const [error, setError] = useState(null);
    const [flags, setFlags] = useState(initialFlags);
    const [nodeId, setNodeId] = useState(null);

    // 2) effect
    useEffect(() => {
        if (!scriptId || scriptId === "none") return;
        let cancelled = false;

        (async () => {
            try {
                const scriptFile = await loadScript(scriptId);
                const prefs = await window.api.preferences.getAll();

                const username = prefs?.username?.trim() || "Buddy";
                const finalScript = injectUsernameIntoScript(scriptFile, username);

                if (!cancelled) {
                    setScript(finalScript);
                    setNodeId(finalScript.start);
                }
            } catch (e) {
                if (!cancelled) setError(e);
            }
        })();

        return () => { cancelled = true; };
    }, [scriptId]);

    // 3) initialise node
    const node = useMemo(
        () => (script && nodeId ? script.nodes?.[nodeId] : null),
        [script, nodeId]
    );

    const visibleChoices = useMemo(() => {
        if (!node || node.type !== "choice") return [];
        return (node.choices ?? []).filter(c => evalCond(c.cond, flags));
    }, [node, flags]);

    const hasNext = useMemo(() => {
        if (!script || !node) return false;
        if (node.type === "line" || node.type === "action") {
        return Boolean(node.next && script.nodes[node.next]);
        }
        if (node.type === "choice") return false;
        return node.type !== "end";
    }, [script, node]);

    const right  = node?.side === "right";
    const avatarUrl = resolveAvatar(node?.avatar);
    console.log(avatarUrl)

    // 4) event handlers
    function handleNext() {
        if (!script || !node) return;

        if (node.type === "line") {
            if (node.next && script.nodes[node.next]) setNodeId(node.next);
            else onDone?.(flags);
            return;
        }

        if (node.type === "action") {
            const newFlags = { ...flags, ...(node.set ?? {}) };
            setFlags(newFlags);
            if (node.next && script.nodes[node.next]) setNodeId(node.next);
            else onDone?.(newFlags);
            return;
        }

        if (node.type === "choice" || node.type === "end") {
            if (node.type === "end") onDone?.(flags);
        }
    }

    function handleChoice(nextId) {
        if (nextId && script?.nodes?.[nextId]) setNodeId(nextId);
        else onDone?.(flags);
    }

    const navigate = useNavigate();
    function goHome() {
        navigate("/");
    }

  // 5) html
    if (error)   return <div className="storyError">Error: {error.message}</div>;
    if (!script) return <div className="storyLoading">Loading…</div>;
    if (!nodeId) return null;
    if (!node)   return <div className="storyError">Node not found: {nodeId}</div>;

    return (
        <div className="storyContainer"> {script.title && <div className="storyTitle"> {script.title} </div>}

            <div className="storyFrame">
                {(node.type === "line" || node.type === "action" || node.type === "choice") && (
                    <div className={right ? "storyRight" : "storyLeft"}>
                        <div className="storyAvatarContainer">
                            {!right && avatarUrl && ( <img className="storyAvatar" src={avatarUrl} alt={node.speaker || "avatar"} /> )}
                        </div>

                        <div className="storyBubble">
                            {!right && ( <div className="storyBubbleName storyBubbleNameLeft">{node.speaker}</div> )}
                            {right && ( <div className="storyBubbleName storyBubbleNameRight">{node.speaker}</div> )}
                            <div className={right ? "storyBubbleRight" : "storyBubbleLeft"}>
                                <p className="storyBubbleText">{node.text}</p>
                            </div>

                            {node.type === "choice" && (
                                <div className="storyChoiceCard" role="group" aria-label="Choices">
                                    {node.prompt && <div className="storyChoicePrompt">{node.prompt}</div>}
                                    <div className="storyChoiceList" role="list">
                                        {visibleChoices.map((c, i) => (
                                            <button
                                                key={i}
                                                role="listitem"
                                                className="storyChoiceBtn"
                                                onClick={() => handleChoice(c.next)}
                                                aria-label={`Choose: ${c.text}`}
                                            >
                                                {c.text}
                                            </button>
                                        ))}
                                        {visibleChoices.length === 0 && ( <div className="storyChoiceEmpty">No choices available.</div> )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="storyAvatarContainer">
                            {right && avatarUrl && ( <img className="storyAvatar" src={avatarUrl} alt={node.speaker || "avatar"} /> )}
                        </div>
                    </div>
                )}

                <div className="storyNextContainer">
                {hasNext && (
                    <button
                    className="storyNextButton"
                    onClick={handleNext}
                    aria-label="Next line"
                    title="Next"
                    >
                        <ArrowRight size={28} strokeWidth={2.5} />
                    </button>
                )}
                </div>

                <div className="storyNextContainer">
                {!hasNext && (
                    <button
                    className="storyNextButton"
                    onClick={goHome}
                    aria-label="Next line"
                    title="Next"
                    >
                        <ArrowRight size={28} strokeWidth={2.5} />
                    </button>
                )}
                </div>
            </div>
        </div>
    );
}
