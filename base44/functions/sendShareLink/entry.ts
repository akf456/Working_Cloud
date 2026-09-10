import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const label = typeof body?.label === 'string' ? body.label.slice(0, 80) : 'organizer';
    const origin = typeof body?.origin === 'string' && body.origin.startsWith('https://') ? body.origin : 'https://working-cloud.base44.app';
    const recipients = Array.isArray(body?.recipients) ? body.recipients : [];
    const clean = recipients.map((r) => String(r).trim().toLowerCase()).filter((r) => EMAIL_RE.test(r)).slice(0, 10);
    if (!token || clean.length === 0) return Response.json({ error: 'Missing link or recipients' }, { status: 400 });

    // Only the link's owner may email it, so this can't be used to send arbitrary links.
    const links = await base44.asServiceRole.entities.ShareLink.filter({ token });
    const link = links && links[0];
    if (!link || link.owner_id !== user.id) return Response.json({ error: 'Not found' }, { status: 404 });

    const url = `${origin}/s/${token}`;
    const fromName = user.full_name || 'A Working Cloud user';
    const canEdit = link.mode === 'edit';
    const subject = `${fromName} shared "${label}" with you on Working Cloud`;
    const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
<p>Hi!</p>
<p><b>${fromName}</b> shared <b>&ldquo;${label}&rdquo;</b> with you on Working Cloud.</p>
<p style="margin:24px 0"><a href="${url}" style="background:#7c6bd4;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open ${label}</a></p>
<p style="font-size:13px;color:#6b7280">${canEdit ? 'You can add, edit and check off tasks &amp; events in it.' : 'You can view the tasks &amp; events in it.'}</p>
<p style="font-size:12px;color:#9ca3af">If the button doesn&rsquo;t work, open this link: ${url}</p>
</div>`;
    const text = `${fromName} shared "${label}" with you on Working Cloud.\n\nOpen it here: ${url}\n\n${canEdit ? 'You can add, edit and check off tasks & events in it.' : 'You can view the tasks & events in it.'}`;

    const sent = [];
    const failed = [];
    for (const to of clean) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, html, text });
        sent.push(to);
      } catch { failed.push(to); }
    }
    return Response.json({ sent, failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}