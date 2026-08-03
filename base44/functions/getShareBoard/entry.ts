import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const token = body?.token;
    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }
    const links = await base44.asServiceRole.entities.ShareLink.filter({ token });
    const link = links && links[0];
    if (!link) return Response.json({ error: 'Not found' }, { status: 404 });
    const owner = link.owner_id;
    const area = link.area || 'shareable';
    const mode = link.mode || 'view';

    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    const editors = link.editors || [];
    const canEdit = mode === 'edit' && !!user && (user.id === owner || editors.includes(user.email));

    const [tasks, events, courses] = await Promise.all([
      base44.asServiceRole.entities.Task.filter({ area, created_by_id: owner }, '-due_date', 300),
      base44.asServiceRole.entities.Event.filter({ area, created_by_id: owner }, '-start_date', 300),
      base44.asServiceRole.entities.Course.filter({ area, created_by_id: owner })
    ]);

    const slim = (items, fields) => items.map((i) => {
      const out = {};
      fields.forEach((f) => { if (i[f] !== undefined) out[f] = i[f]; });
      return out;
    });

    return Response.json({
      area,
      mode,
      can_edit: canEdit,
      tasks: slim(tasks, ['title', 'description', 'due_date', 'priority', 'status', 'type', 'course_id', 'flag']),
      events: slim(events, ['title', 'description', 'start_date', 'end_date', 'all_day', 'type', 'location', 'flag']),
      courses: slim(courses, ['name', 'code', 'color'])
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}