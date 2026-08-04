import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const uid = user.id;
    const entities = ['Task', 'Event', 'Course', 'Contact', 'ShareLink', 'Note', 'SharableRoster'];
    const counts = {};
    for (const name of entities) {
      try {
        await base44.entities[name].deleteMany({ created_by_id: uid });
        counts[name] = 'ok';
      } catch (e) {
        counts[name] = e.message;
      }
    }
    return Response.json({ ok: true, counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}