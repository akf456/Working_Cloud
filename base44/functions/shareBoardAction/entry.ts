import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to edit this organizer.' }, { status: 401 });
    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const token = body?.token;
    const action = body?.action;
    const payload = body?.payload || {};
    if (!token || !action) return Response.json({ error: 'Bad request' }, { status: 400 });

    const links = await base44.asServiceRole.entities.ShareLink.filter({ token });
    const link = links && links[0];
    if (!link) return Response.json({ error: 'Not found' }, { status: 404 });
    if (link.mode !== 'edit') return Response.json({ error: 'This is a view-only link.' }, { status: 403 });
    const editors = link.editors || [];
    if (user.id !== link.owner_id && !editors.includes(user.email)) {
      return Response.json({ error: 'You are not an editor of this organizer.' }, { status: 403 });
    }
    const owner = link.owner_id;
    const area = link.area || 'shareable';
    const sr = base44.asServiceRole;

    if (action === 'addTask') {
      const { title, due_date } = payload;
      if (!title || typeof title !== 'string') return Response.json({ error: 'Title required' }, { status: 400 });
      const t = await sr.entities.Task.create({
        title: String(title).slice(0, 200),
        due_date: due_date || null,
        status: 'todo', priority: 'medium', type: 'misc',
        area, source: 'manual', created_by_id: owner
      });
      return Response.json({ ok: true, id: t.id });
    }
    if (action === 'toggleTask') {
      const task = await sr.entities.Task.get(payload.id);
      if (!task || task.area !== area || task.created_by_id !== owner) return Response.json({ error: 'Not found' }, { status: 404 });
      const next = task.status === 'done' ? 'todo' : 'done';
      await sr.entities.Task.update(payload.id, { status: next });
      return Response.json({ ok: true, status: next });
    }
    if (action === 'deleteTask') {
      const task = await sr.entities.Task.get(payload.id);
      if (!task || task.area !== area || task.created_by_id !== owner) return Response.json({ error: 'Not found' }, { status: 404 });
      await sr.entities.Task.delete(payload.id);
      return Response.json({ ok: true });
    }
    if (action === 'addEvent') {
      const { title, start_date, end_date } = payload;
      if (!title || !start_date) return Response.json({ error: 'Title & date required' }, { status: 400 });
      const e = await sr.entities.Event.create({
        title: String(title).slice(0, 200),
        start_date, end_date: end_date || start_date,
        all_day: true, type: 'event', area, source: 'manual', created_by_id: owner
      });
      return Response.json({ ok: true, id: e.id });
    }
    if (action === 'deleteEvent') {
      const e = await sr.entities.Event.get(payload.id);
      if (!e || e.area !== area || e.created_by_id !== owner) return Response.json({ error: 'Not found' }, { status: 404 });
      await sr.entities.Event.delete(payload.id);
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}