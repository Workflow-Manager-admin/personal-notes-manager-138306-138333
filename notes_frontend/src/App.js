import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Brand colors
const COLORS = {
  primary: "#1976d2",
  secondary: "#424242",
  accent: "#ffca28",
  background: "#ffffff",
  sidebar: "#f6fafd",
  border: "#e9ecef",
  text: "#282c34",
  textGray: "#6e6e6e",
  selected: "#dbeafe"
};

// Generate a unique id for a new note
function generateId() {
  return (
    "note_" +
    Math.random().toString(36).substr(2, 9) +
    "_" +
    Date.now().toString(36)
  );
}

// PUBLIC_INTERFACE
function App() {
  // Notes state: array of {id, title, content, updated}
  const [notes, setNotes] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem("notes:v1");
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Currently selected note id
  const [selectedId, setSelectedId] = useState(null);

  // Search state
  const [query, setQuery] = useState("");

  // Sidebar collapsed (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 600);

  // UI state for adding note
  const [addMode, setAddMode] = useState(false);

  // Effect: save notes to localStorage
  useEffect(() => {
    localStorage.setItem("notes:v1", JSON.stringify(notes));
  }, [notes]);

  // Effect: responsive sidebar
  useEffect(() => {
    function handleResize() {
      setSidebarOpen(window.innerWidth > 600);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pick latest note when notes or search changes
  useEffect(() => {
    // If selected note is not available, pick first from filtered list
    const ids = getFilteredNotes().map((n) => n.id);
    if (ids.length === 0) {
      setSelectedId(null);
    } else if (!ids.includes(selectedId)) {
      setSelectedId(ids[0]);
    }
    // eslint-disable-next-line
  }, [notes, query]);

  // Helper: get notes (filtered)
  function getFilteredNotes() {
    if (!query) return notes.slice().sort((a, b) => b.updated - a.updated);
    const q = query.toLowerCase();
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      )
      .sort((a, b) => b.updated - a.updated);
  }

  // Handler: add note
  function handleAddNote() {
    const newId = generateId();
    const created = Date.now();
    const note = {
      id: newId,
      title: "Untitled Note",
      content: "",
      updated: created
    };
    setNotes([note, ...notes]);
    setSelectedId(newId);
    setAddMode(false);
  }

  // Handler: update note
  function handleEditNote(id, field, value) {
    setNotes((curr) =>
      curr.map((n) =>
        n.id === id ? { ...n, [field]: value, updated: Date.now() } : n
      )
    );
  }

  // Handler: delete note
  function handleDeleteNote(id) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    const idx = notes.findIndex((n) => n.id === id);
    let nextSelected = null;
    if (notes.length > 1) {
      // Pick next or prev note after deletion
      if (idx === notes.length - 1) {
        nextSelected = notes[idx - 1].id;
      } else {
        nextSelected = notes[idx + 1].id;
      }
    }
    setNotes((curr) => curr.filter((n) => n.id !== id));
    setSelectedId(nextSelected);
  }

  // Handler: search
  function handleSearch(e) {
    setQuery(e.target.value);
  }

  // UI: current note
  const selectedNote = notes.find((n) => n.id === selectedId);

  // Ref for focusing title
  const titleRef = useRef();

  // Handler: select note
  function handleSelectNote(id) {
    setSelectedId(id);
    setSidebarOpen(false); // auto-close on mobile
  }

  // Handler: start add
  function handleStartAdd() {
    setAddMode(true);
  }

  // Handler: cancel add
  function handleCancelAdd() {
    setAddMode(false);
  }

  // Handler: sidebar toggle (mobile)
  function handleSidebarToggle() {
    setSidebarOpen((open) => !open);
  }

  // Shortcuts (focus title on select)
  useEffect(() => {
    if (selectedNote && titleRef.current) {
      titleRef.current.focus();
    }
  }, [selectedId]);

  return (
    <div className="notes-app" style={{ background: COLORS.background, color: COLORS.text }}>
      {/* Top Navigation Bar */}
      <nav className="notes-navbar" style={{ background: COLORS.primary }}>
        <div className="navbar-brand">📝 Notes</div>
        <button
          className="navbar-btn"
          style={{ borderColor: COLORS.accent }}
          onClick={handleStartAdd}
          title="New Note"
        >
          + New
        </button>
        <div className="navbar-spacer" />
        <input
          className="navbar-search"
          style={{ borderColor: COLORS.accent }}
          placeholder="Search notes…"
          value={query}
          onChange={handleSearch}
        />
        <button
          className="navbar-btn sidebar-toggle"
          onClick={handleSidebarToggle}
          title="Toggle notes list"
          aria-label="Open/close note list"
        >
          ☰
        </button>
      </nav>

      {/* Main Layout */}
      <div className="notes-layout">
        {/* Sidebar: Notes List */}
        <aside
          className={`notes-sidebar ${
            sidebarOpen ? "open" : "closed"
          }`}
          style={{
            background: COLORS.sidebar,
            borderRight: `1px solid ${COLORS.border}`
          }}
        >
          <div className="sidebar-header">
            <span style={{ fontWeight: 700 }}>Notes ({notes.length})</span>
          </div>
          <ul className="notes-list">
            {getFilteredNotes().length === 0 && (
              <li className="empty">No notes found.</li>
            )}
            {getFilteredNotes().map((note) => (
              <li
                key={note.id}
                className={note.id === selectedId ? "selected" : ""}
                style={
                  note.id === selectedId
                    ? { background: COLORS.selected }
                    : undefined
                }
                onClick={() => handleSelectNote(note.id)}
                tabIndex={0}
                aria-selected={note.id === selectedId}
              >
                <div className="note-title">
                  {note.title || <span style={{ color: COLORS.textGray }}>Untitled</span>}
                </div>
                <div className="note-updated">
                  {formatDate(note.updated)}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Content/Main area */}
        <main className="notes-main">
          {addMode ? (
            <div className="note-new">
              <div className="note-new-title">Create a new note?</div>
              <div className="note-new-actions">
                <button
                  className="new-btn"
                  style={{ background: COLORS.primary, color: "#fff" }}
                  onClick={handleAddNote}
                >
                  Create Note
                </button>
                <button
                  className="new-btn cancel"
                  style={{
                    background: "#fff",
                    color: COLORS.primary,
                    border: `1px solid ${COLORS.primary}`
                  }}
                  onClick={handleCancelAdd}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
              titleRef={titleRef}
              accentColor={COLORS.accent}
              primaryColor={COLORS.primary}
            />
          ) : (
            <div className="note-empty">
              <div style={{ fontSize: 24, color: COLORS.textGray }}>
                <span role="img" aria-label="No note">
                  🗒️
                </span>
                <br />
                No note selected.
              </div>
              <button
                className="new-btn"
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  marginTop: 28
                }}
                onClick={handleStartAdd}
              >
                + New Note
              </button>
            </div>
          )}
        </main>
      </div>
      {/* Responsive mask for sidebar on mobile */}
      <div
        className={`sidebar-mask ${sidebarOpen ? "open" : ""}`}
        onClick={handleSidebarToggle}
        aria-hidden={!sidebarOpen}
      ></div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({
  note,
  onEdit,
  onDelete,
  titleRef,
  accentColor,
  primaryColor
}) {
  // Local state for content (for better UX)
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  // Controlled input: reflect note change
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  function handleTitleChange(e) {
    setTitle(e.target.value);
    onEdit(note.id, "title", e.target.value);
  }

  function handleContentChange(e) {
    setContent(e.target.value);
    onEdit(note.id, "content", e.target.value);
  }

  return (
    <div className="note-editor">
      <input
        className="editor-title"
        value={title}
        onChange={handleTitleChange}
        ref={titleRef}
        placeholder="Note title…"
        maxLength={64}
        style={{ borderColor: accentColor }}
        autoFocus
      />
      <textarea
        className="editor-content"
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing your note here…"
        rows={10}
        style={{ borderColor: accentColor }}
      />
      <div className="editor-actions">
        <button
          className="delete-btn"
          style={{
            background: "#fff",
            color: primaryColor,
            border: `1px solid ${primaryColor}`
          }}
          onClick={() => onDelete(note.id)}
          title="Delete Note"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Helper
function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  // Today, Yesterday, or date string
  const today = new Date();
  const dt = new Date(ts);
  if (
    today.getFullYear() === dt.getFullYear() &&
    today.getMonth() === dt.getMonth() &&
    today.getDate() === dt.getDate()
  )
    return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (
    yesterday.getFullYear() === dt.getFullYear() &&
    yesterday.getMonth() === dt.getMonth() &&
    yesterday.getDate() === dt.getDate()
  )
    return "Yesterday";
  // Otherwise, mm/dd/yy
  return (
    String(dt.getMonth() + 1).padStart(2, "0") +
    "/" +
    String(dt.getDate()).padStart(2, "0") +
    "/" +
    String(dt.getFullYear()).slice(-2)
  );
}

export default App;
