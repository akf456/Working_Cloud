import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ListChecks, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Checklist-style creator/editor for to-do lists. The user names the list and
// adds items directly (like a checklist) instead of filling out a task form.
// For an existing list, its current items (subtasks) are loaded so they can be
// checked off, removed, or added to. The parent reconciles persistence on save.
export default function ChecklistModal({ open, onClose, onSave, list }) {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(list?.title || '');
    setDraft('');
    if (list?.id) {
      setLoading(true);
      base44.entities.Subtask.filter({ parent_task_id: list.id })
        .then((all) => setItems(all.map((s) => ({ id: s.id, title: s.title, status: s.status || 'todo' }))))
        .finally(() => setLoading(false));
    } else {
      setItems([]);
    }
  }, [open, list]);

  function addDraft() {
    if (!draft.trim()) return;
    setItems((prev) => [...prev, { title: draft.trim(), status: 'todo' }]);
    setDraft('');
  }

  function toggleItem(idx) {
    setItems((prev) => prev.map((i, k) => (k === idx ? { ...i, status: i.status === 'done' ? 'todo' : 'done' } : i)));
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, k) => k !== idx));
  }

  function startEdit(idx) {
    setEditingIdx(idx);
    setEditVal(items[idx]?.title || '');
  }

  function commitEdit() {
    if (editingIdx === null) return;
    const v = editVal.trim();
    setItems((prev) => prev.map((i, k) => (k === editingIdx ? { ...i, title: v || i.title } : i)));
    setEditingIdx(null);
    setEditVal('');
  }

  function submit() {
    if (!title.trim()) return;
    onSave({ id: list?.id, title: title.trim(), items });
    onClose();
  }

  const keyOf = (it, idx) => it.id || `local-${idx}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ListChecks className="w-5 h-5 text-indigo-600" /> {list ? 'Edit checklist' : 'New checklist'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-title">List name</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grocery run" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Items</Label>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-2 max-h-72 overflow-y-auto">
              {items.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">No items yet — add a few below.</p>
              )}
              <div className="space-y-1">
                {items.map((it, idx) => {
                  const done = it.status === 'done';
                  return (
                    <div key={keyOf(it, idx)} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-background">
                      <Checkbox checked={done} onCheckedChange={() => toggleItem(idx)} className="shrink-0" />
                      {editingIdx === idx ? (
                        <Input
                          autoFocus
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                            else if (e.key === 'Escape') { setEditingIdx(null); setEditVal(''); }
                          }}
                          className="h-8 text-sm flex-1"
                        />
                      ) : (
                        <span onDoubleClick={() => startEdit(idx)} className={`text-sm flex-1 truncate cursor-text ${done ? 'line-through text-muted-foreground' : ''}`} title="Double-click to rename">{it.title}</span>
                      )}
                      <button type="button" onClick={() => startEdit(idx)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-indigo-600 transition shrink-0" title="Rename">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => removeItem(idx)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-rose-600 transition shrink-0" title="Remove">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an item…"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDraft(); } }} />
              <Button type="button" variant="outline" className="shrink-0" onClick={addDraft}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>{list ? 'Save changes' : 'Create list'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}