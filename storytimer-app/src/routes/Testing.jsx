// src/renderer/NotesDemo.jsx
import { useEffect, useState } from 'react';

export default function Testing() {
    const [notes, setNotes] = useState([]);
    const [newText, setNewText] = useState('');

    async function refresh() {
        const rows = await window.notes.list(50, 0);
        setNotes(rows);
    }

    async function addDummy() {
        const text = (newText || '').trim() || `Hello at ${new Date().toLocaleString()}`;
        await window.notes.add(text);
        setNewText('');
        await refresh();
    }

    useEffect(() => {
        refresh();
    }, []);

    return (
        <div style={{ padding: 16, maxWidth: 520 }}>
        <h2>Notes (SQLite demo)</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
            placeholder="Type a note…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            style={{ flex: 1 }}
            />
            <button onClick={addDummy}>Add</button>
            <button onClick={refresh}>Reload</button>
        </div>

        <ul style={{ paddingLeft: 18 }}>
            {notes.map((n) => (
            <li key={n.id}>
                <b>#{n.id}</b> — {new Date(n.created_at).toLocaleString()} — {n.text}
            </li>
            ))}
        </ul>
        </div>
    );
}
