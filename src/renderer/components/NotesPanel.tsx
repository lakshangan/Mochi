import React, { useState } from 'react';
import { NoteItem } from '../../shared/types';
import { Plus, Trash2, Edit3, Check, FileText, Search } from 'lucide-react';

interface NotesPanelProps {
  notes: NoteItem[];
  onAddNote: (title: string, content: string, color?: string) => void;
  onUpdateNote: (id: string, partial: Partial<NoteItem>) => void;
  onDeleteNote: (id: string) => void;
}

const NOTE_COLORS = ['#4facfe', '#38ef7d', '#ff9f1c', '#f72585', '#9d4edd'];

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddNote(newTitle.trim() || 'Quick Note', newContent.trim(), selectedColor);
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const startEdit = (note: NoteItem) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = (id: string) => {
    onUpdateNote(id, { title: editTitle, content: editContent });
    setEditingId(null);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="panel-container">
      {/* Top action row */}
      <div className="notes-header-row">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {!isCreating && (
          <button className="btn btn-sm btn-primary" onClick={() => setIsCreating(true)}>
            <Plus size={14} /> New Note
          </button>
        )}
      </div>

      {/* Note Creation Form */}
      {isCreating && (
        <form onSubmit={handleSaveNew} className="new-note-card">
          <input
            type="text"
            placeholder="Title (optional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="note-title-input"
          />
          <textarea
            placeholder="Type your thoughts, scratchpad, ideas..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="note-content-input"
            autoFocus
          />

          <div className="note-card-footer">
            <div className="color-picker-row">
              {NOTE_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`color-dot ${selectedColor === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setSelectedColor(c)}
                />
              ))}
            </div>

            <div className="btn-group">
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      <div className="notes-list-scroll">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <FileText size={28} className="empty-icon text-cyan" />
            <div className="empty-title">No notes yet</div>
            <div className="empty-subtitle">
              Capture quick thoughts, meeting notes, or ideas anytime.
            </div>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="note-item-card"
              style={{ borderLeftColor: note.color || '#4facfe' }}
            >
              {editingId === note.id ? (
                <div className="note-edit-body">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="note-title-input"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="note-content-input"
                  />
                  <div className="note-card-footer">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => saveEdit(note.id)}
                    >
                      <Check size={14} /> Update
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="note-card-top">
                    <span className="note-title">{note.title}</span>
                    <div className="note-actions">
                      <button
                        className="btn-icon-subtle"
                        onClick={() => startEdit(note)}
                        title="Edit note"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="btn-icon-subtle text-danger"
                        onClick={() => onDeleteNote(note.id)}
                        title="Delete note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="note-body-text">{note.content}</div>
                  <div className="note-date">
                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
