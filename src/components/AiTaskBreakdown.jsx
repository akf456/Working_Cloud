import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SheetSelect from '@/components/SheetSelect';
import { Sparkles, Loader2, Wand2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmt } from '@/lib/planner';

const DAY_OPTIONS = [
  { value: '2', label: '2 days' },
  { value: '3', label: '3 days' },
  { value: '5', label: '5 days' },
  { value: '7', label: '7 days' },
  { value: '10', label: '10 days' },
  { value: '14', label: '14 days' }
];

export default function AiTaskBreakdown({ open, onClose, area, onDone }) {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [days, setDays] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDifficulty(''); setDays('5'); setError(''); setResult(null); setSaving(false); setSaved(false); setTaskId('');
    base44.entities.Task.filter({ area }, '-due_date', 200).then((t) => {
      setTasks(t.filter((x) => x.status !== 'done'));
    }).catch(() => setTasks([]));
  }, [open, area]);

  const task = tasks.find((t) => t.id === taskId) || null;

  async function generate() {
    if (!task) { setError('Pick a task to break down.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const due = task.due_date ? fmt(task.due_date, 'yyyy-MM-dd') : null;
      const count = Math.max(2, Math.min(10, Number(days)));
      const prompt = `You are a warm, motivating productivity coach. Break the following task into ${count} small, concrete subtasks so the user never loses motivation.

Task: ${task.title}
${task.description ? `Details: ${task.description}\n` : ''}${due ? `Final due date: ${due}\n` : ''}Hardest part for the user: ${difficulty || 'not specified'}
Spread the work across about ${days} days${due ? ' leading up to the due date' : ''}, starting from today (${new Date().toISOString().slice(0, 10)}).

Each subtask should take ~20–60 minutes, be a single clear action, and build momentum by starting easy. Order them logically. Assign each a due_date (ISO 8601)${due ? ' on or before the final due date' : ''}.

Return JSON: { "subtasks": [ { "title": string, "due_date": ISO string }, ... ] }.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            subtasks: {
              type: 'array',
              items: { type: 'object', properties: { title: { type: 'string' }, due_date: { type: 'string' } } }
            }
          }
        }
      });
      const subs = Array.isArray(res?.subtasks) ? res.subtasks.filter((s) => s.title) : [];
      if (!subs.length) setError('AI could not break this down — try adding a bit more detail.');
      else setResult(subs);
    } catch (e) {
      setError(e?.message || 'Could not generate subtasks.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result || !task) return;
    setSaving(true); setError('');
    try {
      await base44.entities.Subtask.bulkCreate(result.map((s) => ({
        parent_task_id: task.id,
        title: s.title,
        due_date: s.due_date || null,
        status: 'todo'
      })));
      setSaved(true);
      onDone?.();
    } catch (e) {
      setError(e?.message || 'Could not save subtasks.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-primary" /> AI task breakdown</DialogTitle>
          <DialogDescription>Break any task into small, motivating steps — pick a task, tell us what's hard, and choose your pace.</DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-lg">Subtasks added!</p>
            <p className="text-sm text-muted-foreground mt-1">{result.length} steps were added to “{task?.title}”. Open the task to see them.</p>
            <Button className="mt-5" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Pick a task</Label>
              <SheetSelect value={taskId} onValueChange={setTaskId} placeholder="Choose a task to break down"
                options={tasks.map((t) => ({ value: t.id, label: `${t.title}${t.due_date ? ` · ${fmt(t.due_date, 'MMM d')}` : ''}` }))} />
            </div>

            {task && (
              <div className="space-y-1.5">
                <Label>What is (or would be) the most difficult part of this task for you?</Label>
                <Textarea value={difficulty} onChange={(e) => setDifficulty(e.target.value)} rows={2} placeholder="e.g. Getting started, the research part, staying focused…" />
              </div>
            )}

            {task && (
              <div className="space-y-1.5">
                <Label>Over how many days would you like to break this into?</Label>
                <SheetSelect value={days} onValueChange={setDays} placeholder="Spread across…" options={DAY_OPTIONS} />
                <p className="text-xs text-muted-foreground">Smaller milestones keep momentum going even when motivation dips.</p>
              </div>
            )}

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

            {result && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Suggested subtasks</p>
                <div className="space-y-1.5">
                  {result.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-card rounded-lg px-3 py-2">
                      <span className="text-sm truncate">{s.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{s.due_date ? fmt(s.due_date, 'MMM d') : ''}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">These will be added as subtasks on “{task?.title}”. You can edit them anytime.</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              {!result ? (
                <Button onClick={generate} disabled={!task || loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Breaking down…</> : <><Sparkles className="w-4 h-4 mr-2" /> Break it down</>}
                </Button>
              ) : (
                <Button onClick={save} disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : <>Add {result.length} subtasks</>}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}