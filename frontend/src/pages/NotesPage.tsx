import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge, Modal, Skeleton, SkeletonCard } from '../components/ui';
import {
  PlusIcon, DocumentTextIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon,
  FunnelIcon, BookmarkIcon, BookmarkIcon, EyeIcon, ArrowDownTrayIcon,
  BoldIcon, ItalicIcon, ListBulletIcon, ListBulletIcon,
  CodeBracketIcon, MinusIcon, CheckCircleIcon, ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { toast } from '../components/ui/Toast';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  subject?: { id: string; name: string; color: string };
  createdAt: string;
  updatedAt: string;
}

interface Subject { id: string; name: string; color: string; }

export function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subjectId: '',
    tags: '',
    pinned: false
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your notes...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({ lowlight })
    ],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      setFormData({ ...formData, content: editor.getHTML() });
    }
  });

  useEffect(() => {
    fetchData();
  }, [search, subjectFilter, showPinnedOnly]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notesRes, subjectsRes] = await Promise.all([
        api.get('/api/notes', { params: { search: search || undefined, subjectId: subjectFilter || undefined, pinned: showPinnedOnly } }),
        api.get('/api/subjects')
      ]);
      setNotes(notesRes.data.notes);
      setSubjects(subjectsRes.data.subjects);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (note?: Note) => {
    setEditingNote(note || null);
    setFormData(note ? {
      title: note.title,
      content: note.content,
      subjectId: note.subject?.id || '',
      tags: note.tags.join(', '),
      pinned: note.pinned
    } : {
      title: '',
      content: '',
      subjectId: '',
      tags: '',
      pinned: false
    });
    editor.commands.setContent(note?.content || '');
    setModalOpen(true);
  };

  const saveNote = async () => {
    if (!formData.title.trim()) { toast.error('Title required'); return; }
    try {
      const data = {
        title: formData.title,
        content: formData.content,
        subjectId: formData.subjectId || undefined,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        pinned: formData.pinned
      };
      if (editingNote) {
        await api.patch(`/api/notes/${editingNote.id}`, data);
        toast.success('Note updated');
      } else {
        await api.post('/api/notes', data);
        toast.success('Note created');
      }
      closeModal();
      fetchData();
    } catch { toast.error('Failed to save note'); }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try { await api.delete(`/api/notes/${id}`); toast.success('Note deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  const togglePin = async (note: Note) => {
    try {
      await api.patch(`/api/notes/${note.id}`, { pinned: !note.pinned });
      fetchData();
    } catch { toast.error('Failed to update'); }
  };

  const closeModal = () => { setModalOpen(false); setEditingNote(null); editor.commands.setContent(''); };

  const filteredNotes = notes.filter(note => {
    if (showPinnedOnly && !note.pinned) return false;
    if (subjectFilter && note.subject?.id !== subjectFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton variant="text" width="40%" height="2rem" /><Skeleton variant="text" width="20%" height="2rem" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-sm font-bold text-surface-50">Notes</h1>
          <p className="text-body-lg text-surface-400 mt-1">Capture and organize your study materials</p>
        </div>
        <Button variant="primary" onClick={() => openModal()}><PlusIcon className="h-5 w-5" /> New Note</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-500" />
              <input
                type="search"
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-50 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="input w-auto" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-body-sm font-medium text-surface-400 hover:bg-surface-800 hover:text-surface-100 cursor-pointer border border-surface-600">
                <input type="checkbox" checked={showPinnedOnly} onChange={e => setShowPinnedOnly(e.target.checked)} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500" />
                <BookmarkIcon className="h-4 w-4" /> Pinned
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredNotes.length === 0 ? (
        <Card className="text-center py-16">
          <DocumentTextIcon className="h-16 w-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-heading-md font-semibold text-surface-50 mb-2">{notes.length === 0 ? 'No notes yet' : 'No notes found'}</h3>
          <p className="text-surface-400 mb-6">{notes.length === 0 ? 'Create your first note to start building your knowledge base' : 'Try adjusting your filters or search'}</p>
          <Button variant="primary" onClick={() => openModal()}><PlusIcon className="h-5 w-5" /> {notes.length === 0 ? 'Create Note' : 'Clear Filters'}</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <NoteCard key={note.id} note={note} onEdit={openModal} onDelete={deleteNote} onTogglePin={togglePin} />
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingNote ? 'Edit Note' : 'New Note'} size="xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Title" placeholder="Note title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} error={!formData.title && editingNote ? 'Required' : undefined} />
          <div className="grid grid-cols-2 gap-4">
            <select className="input" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Input label="Tags (comma separated)" placeholder="math, formulas, exam-prep" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} />
          </div>
          <label className="flex items-center gap-2 text-body-sm text-surface-300 cursor-pointer">
            <input type="checkbox" checked={formData.pinned} onChange={e => setFormData({...formData, pinned: e.target.checked})} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500" />
            <BookmarkIcon className="h-4 w-4" /> Pin note
          </label>

          <div className="border border-surface-700 rounded-xl overflow-hidden">
            <div className="flex flex-wrap gap-1 p-2 border-b border-surface-700 bg-surface-800/50">
              {[
                { icon: BoldIcon, label: 'Bold', action: () => editor.chain().focus().toggleBold().run() },
                { icon: ItalicIcon, label: 'Italic', action: () => editor.chain().focus().toggleItalic().run() },
                { icon: ListBulletIcon, label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run() },
                { icon: ListBulletIcon, label: 'Numbered List', action: () => editor.chain().focus().toggleOrderedList().run() },
                { icon: CheckCircleIcon, label: 'Task List', action: () => editor.chain().focus().toggleTaskList().run() },
                { icon: CodeBracketIcon, label: 'Code Block', action: () => editor.chain().focus().toggleCodeBlock().run() },
                { icon: ChatBubbleLeftRightIcon, label: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run() },
                { icon: MinusIcon, label: 'Divider', action: () => editor.chain().focus().setHorizontalRule().run() },
              ].map((tool) => (
                <button type="button" onClick={tool.action} className="p-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700 transition-colors" aria-label={tool.label} title={tool.label}>
                  <tool.icon className="h-5 w-5" />
                </button>
              ))}
            </div>
            <EditorContent editor={editor} className="prose prose-invert dark max-w-none p-4 min-h-[300px]" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700/50">
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={saveNote}>{editingNote ? 'Save Changes' : 'Create Note'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onTogglePin }: { note: Note; onEdit: (n: Note) => void; onDelete: (id: string) => void; onTogglePin: (n: Note) => void }) {
  const contentText = note.content.replace(/<[^>]*>/g, '').slice(0, 150);

  return (
    <Card variant="hover" className={`${note.pinned ? 'ring-2 ring-yellow-500/30' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-surface-50 truncate pr-4">{note.title}</h3>
          <div className="flex items-center gap-1">
            {note.pinned && <BookmarkIcon className="h-4 w-4 text-yellow-400" />}
            <button onClick={e => { e.stopPropagation(); onTogglePin(note); }} className="p-1.5 rounded-lg text-surface-500 hover:text-yellow-400 hover:bg-surface-800" aria-label={note.pinned ? 'Unpin' : 'Pin'}>
              {note.pinned ? <BookmarkIcon className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
            </button>
            <button onClick={e => { e.stopPropagation(); onEdit(note); }} className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800" aria-label="Edit"><PencilIcon className="h-4 w-4" /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(note.id); }} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-800" aria-label="Delete"><TrashIcon className="h-4 w-4" /></button>
          </div>
        </div>

        {note.subject && (
          <Badge variant="outline" className="mb-3" style={{ borderColor: note.subject.color, color: note.subject.color }}>
            {note.subject.name}
          </Badge>
        )}

        <p className="text-body-sm text-surface-400 line-clamp-3 mb-3">{contentText || 'Empty note'}</p>

        <div className="flex items-center justify-between pt-3 border-t border-surface-700/50">
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="neutral" className="text-xs">{tag}</Badge>
            ))}
            {note.tags.length > 3 && <Badge variant="neutral" className="text-xs">+{note.tags.length - 3}</Badge>}
          </div>
          <span className="text-body-xs text-surface-500">Updated {format(new Date(note.updatedAt), 'MMM d')}</span>
        </div>
      </CardContent>
    </Card>
  );
}