import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Narrow, app-specific operation: generates a motivating subtask breakdown for
// a task the caller owns. The prompt is built server-side so the endpoint never
// accepts a freeform prompt — only a task id, an optional difficulty note, and
// a pace in days.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const taskId = body?.taskId;
    if (!taskId) return Response.json({ error: 'taskId is required' }, { status: 400 });

    const difficulty = (body?.difficulty || '').toString();
    const days = Math.max(1, Math.min(60, Number(body?.days) || 5));
    const count = Math.max(2, Math.min(10, days));

    // User-scoped read so RLS guarantees the caller owns the task.
    const task = await base44.entities.Task.get(taskId);
    if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });

    const due = task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : null;
    const today = new Date().toISOString().slice(0, 10);

    const prompt = `You are a warm, motivating productivity coach. Break the following task into ${count} small, concrete subtasks so the user never loses motivation.

Task: ${task.title}
${task.description ? `Details: ${task.description}\n` : ''}${due ? `Final due date: ${due}\n` : ''}Hardest part for the user: ${difficulty || 'not specified'}
Spread the work across about ${days} days${due ? ' leading up to the due date' : ''}, starting from today (${today}).

Each subtask should take ~20–60 minutes, be a single clear action, and build momentum by starting easy. Order them logically. Assign each a due_date (ISO 8601)${due ? ' on or before the final due date' : ''}.

Return JSON: { "subtasks": [ { "title": string, "due_date": ISO string }, ... ] }.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
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

    const subs = Array.isArray(res?.subtasks) ? res.subtasks.filter((s) => s && s.title) : [];
    return Response.json({ subtasks: subs });
  } catch (error) {
    return Response.json({ error: error?.message || 'Could not generate subtasks' }, { status: 500 });
  }
}